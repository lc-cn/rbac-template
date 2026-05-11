import { createHash, randomBytes } from 'node:crypto'
import { boolFromSql, getDb, newId, nowIso } from '@/lib/db'
import {
  MFA_RATE_MAX_FAIL,
  MFA_RATE_WINDOW_SEC,
  rateLimitBucketStart,
} from '@/lib/mfa-rate-limit'
import { mfaRateLimitIpKey } from '@/lib/mfa-ip-hmac'

export type WebAuthnChallengeKind =
  | 'register_authenticated'
  | 'authenticate_login'
  | 'authenticate_mfa'
  | 'mfa_totp_setup'

export async function getUserCredentialVersion(userId: string): Promise<number> {
  const db = getDb()
  const r = await db.execute({
    sql: `SELECT "credentialVersion" FROM "User" WHERE "id" = ?`,
    args: [userId],
  })
  const row = r.rows[0] as unknown as { credentialVersion?: number | bigint } | undefined
  if (!row) return 0
  const v = row.credentialVersion
  return typeof v === 'bigint' ? Number(v) : Number(v ?? 0)
}

export async function incrementUserCredentialVersion(userId: string): Promise<void> {
  const db = getDb()
  await db.execute({
    sql: `UPDATE "User" SET "credentialVersion" = "credentialVersion" + 1, "updatedAt" = ? WHERE "id" = ?`,
    args: [nowIso(), userId],
  })
}

export async function getUserMfaRow(userId: string): Promise<{
  mfaEnabled: boolean
  totpSecretEnc: string | null
  backupCodesSalt: string | null
} | null> {
  const db = getDb()
  const r = await db.execute({
    sql: `SELECT "mfaEnabled", "totpSecretEnc", "backupCodesSalt" FROM "UserMfaSecurity" WHERE "userId" = ?`,
    args: [userId],
  })
  const row = r.rows[0] as unknown as Record<string, unknown> | undefined
  if (!row) return null
  return {
    mfaEnabled: boolFromSql(row.mfaEnabled),
    totpSecretEnc: row.totpSecretEnc == null ? null : String(row.totpSecretEnc),
    backupCodesSalt: row.backupCodesSalt == null ? null : String(row.backupCodesSalt),
  }
}

export async function upsertUserMfaRow(
  userId: string,
  patch: Partial<{ mfaEnabled: boolean; totpSecretEnc: string | null; backupCodesSalt: string | null }>
): Promise<void> {
  const db = getDb()
  const t = nowIso()
  const cur = await getUserMfaRow(userId)
  const mfaEnabled = patch.mfaEnabled ?? cur?.mfaEnabled ?? false
  const totpSecretEnc = patch.totpSecretEnc !== undefined ? patch.totpSecretEnc : cur?.totpSecretEnc ?? null
  const backupCodesSalt = patch.backupCodesSalt !== undefined ? patch.backupCodesSalt : cur?.backupCodesSalt ?? null
  await db.execute({
    sql: `INSERT INTO "UserMfaSecurity" ("userId","mfaEnabled","totpSecretEnc","backupCodesSalt","createdAt","updatedAt")
          VALUES (?,?,?,?,?,?)
          ON CONFLICT("userId") DO UPDATE SET
            "mfaEnabled" = excluded."mfaEnabled",
            "totpSecretEnc" = excluded."totpSecretEnc",
            "backupCodesSalt" = excluded."backupCodesSalt",
            "updatedAt" = excluded."updatedAt"`,
    args: [userId, mfaEnabled ? 1 : 0, totpSecretEnc, backupCodesSalt, t, t],
  })
}

export async function deleteUserMfaData(userId: string): Promise<void> {
  const db = getDb()
  await db.execute({ sql: `DELETE FROM "UserBackupCode" WHERE "userId" = ?`, args: [userId] })
  await db.execute({ sql: `DELETE FROM "UserMfaSecurity" WHERE "userId" = ?`, args: [userId] })
}

export async function listWebAuthnCredentials(userId: string) {
  const db = getDb()
  const r = await db.execute({
    sql: `SELECT "id","credentialId","counter","transports","canLogin","canMfa","label","createdAt"
          FROM "WebAuthnCredential" WHERE "userId" = ? ORDER BY "createdAt" ASC`,
    args: [userId],
  })
  return (r.rows as unknown as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    credentialId: String(row.credentialId),
    counter: Number(row.counter ?? 0),
    transports: row.transports == null ? null : String(row.transports),
    canLogin: boolFromSql(row.canLogin),
    canMfa: boolFromSql(row.canMfa),
    label: row.label == null ? null : String(row.label),
    createdAt: String(row.createdAt),
  }))
}

export async function getWebAuthnCredentialByCredentialId(credentialId: string) {
  const db = getDb()
  const r = await db.execute({
    sql: `SELECT * FROM "WebAuthnCredential" WHERE "credentialId" = ? LIMIT 1`,
    args: [credentialId],
  })
  const row = r.rows[0] as unknown as Record<string, unknown> | undefined
  if (!row) return null
  return {
    id: String(row.id),
    userId: String(row.userId),
    credentialId: String(row.credentialId),
    publicKey: String(row.publicKey),
    counter: Number(row.counter ?? 0),
    transports: row.transports == null ? null : String(row.transports),
    canLogin: boolFromSql(row.canLogin),
    canMfa: boolFromSql(row.canMfa),
    label: row.label == null ? null : String(row.label),
    createdAt: String(row.createdAt),
  }
}

export async function insertWebAuthnCredential(params: {
  userId: string
  credentialId: string
  publicKey: string
  counter: number
  transports: string | null
  canLogin: boolean
  canMfa: boolean
  label: string | null
}): Promise<string> {
  const db = getDb()
  const id = newId()
  await db.execute({
    sql: `INSERT INTO "WebAuthnCredential"
          ("id","userId","credentialId","publicKey","counter","transports","canLogin","canMfa","label","createdAt")
          VALUES (?,?,?,?,?,?,?,?,?,datetime('now'))`,
    args: [
      id,
      params.userId,
      params.credentialId,
      params.publicKey,
      params.counter,
      params.transports,
      params.canLogin ? 1 : 0,
      params.canMfa ? 1 : 0,
      params.label,
    ],
  })
  return id
}

export async function updateWebAuthnCredentialFlags(
  id: string,
  userId: string,
  patch: { canLogin?: boolean; canMfa?: boolean; label?: string | null }
): Promise<boolean> {
  const db = getDb()
  const sets: string[] = []
  const args: (string | number | null)[] = []
  if (patch.canLogin !== undefined) {
    sets.push(`"canLogin" = ?`)
    args.push(patch.canLogin ? 1 : 0)
  }
  if (patch.canMfa !== undefined) {
    sets.push(`"canMfa" = ?`)
    args.push(patch.canMfa ? 1 : 0)
  }
  if (patch.label !== undefined) {
    sets.push(`"label" = ?`)
    args.push(patch.label)
  }
  if (!sets.length) return true
  args.push(userId, id)
  const r = await db.execute({
    sql: `UPDATE "WebAuthnCredential" SET ${sets.join(', ')} WHERE "userId" = ? AND "id" = ?`,
    args,
  })
  return (r.rowsAffected ?? 0) > 0
}

export async function deleteWebAuthnCredential(id: string, userId: string): Promise<boolean> {
  const db = getDb()
  const r = await db.execute({
    sql: `DELETE FROM "WebAuthnCredential" WHERE "id" = ? AND "userId" = ?`,
    args: [id, userId],
  })
  return (r.rowsAffected ?? 0) > 0
}

export async function deleteAllWebAuthnCredentialsForUser(userId: string): Promise<void> {
  const db = getDb()
  await db.execute({ sql: `DELETE FROM "WebAuthnCredential" WHERE "userId" = ?`, args: [userId] })
}

export async function updateWebAuthnCredentialCounter(credentialId: string, counter: number): Promise<void> {
  const db = getDb()
  await db.execute({
    sql: `UPDATE "WebAuthnCredential" SET "counter" = ? WHERE "credentialId" = ?`,
    args: [counter, credentialId],
  })
}

export async function insertWebAuthnChallenge(params: {
  challenge: string
  userId: string | null
  kind: string
  email: string | null
  metadata: string | null
  expiresAtIso: string
}): Promise<string> {
  const db = getDb()
  const id = newId()
  await db.execute({
    sql: `INSERT INTO "WebAuthnChallenge" ("id","challenge","userId","kind","email","expiresAt","metadata","createdAt")
          VALUES (?,?,?,?,?,?,?,datetime('now'))`,
    args: [
      id,
      params.challenge,
      params.userId,
      params.kind,
      params.email,
      params.expiresAtIso,
      params.metadata,
    ],
  })
  return id
}

export async function consumeWebAuthnChallenge(
  id: string,
  expectedKind: string
): Promise<{ challenge: string; userId: string | null; email: string | null; metadata: string | null } | null> {
  const db = getDb()
  const r = await db.execute({
    sql: `SELECT "id","challenge","userId","kind","email","metadata","expiresAt" FROM "WebAuthnChallenge" WHERE "id" = ?`,
    args: [id],
  })
  const row = r.rows[0] as unknown as Record<string, unknown> | undefined
  if (!row) return null
  if (String(row.kind) !== expectedKind) return null
  const exp = new Date(String(row.expiresAt)).getTime()
  if (!Number.isFinite(exp) || exp < Date.now()) {
    await db.execute({ sql: `DELETE FROM "WebAuthnChallenge" WHERE "id" = ?`, args: [id] })
    return null
  }
  await db.execute({ sql: `DELETE FROM "WebAuthnChallenge" WHERE "id" = ?`, args: [id] })
  return {
    challenge: String(row.challenge),
    userId: row.userId == null ? null : String(row.userId),
    email: row.email == null ? null : String(row.email),
    metadata: row.metadata == null ? null : String(row.metadata),
  }
}

export async function pruneExpiredWebAuthnChallenges(): Promise<void> {
  const db = getDb()
  await db.execute({
    sql: `DELETE FROM "WebAuthnChallenge" WHERE datetime("expiresAt") < datetime('now')`,
    args: [],
  })
}

export async function replaceUserBackupCodes(userId: string, codeHashes: string[], salt: string): Promise<void> {
  const db = getDb()
  await db.execute({ sql: `DELETE FROM "UserBackupCode" WHERE "userId" = ?`, args: [userId] })
  for (const h of codeHashes) {
    const id = newId()
    await db.execute({
      sql: `INSERT INTO "UserBackupCode" ("id","userId","codeHash","createdAt") VALUES (?,?,?,datetime('now'))`,
      args: [id, userId, h],
    })
  }
  await upsertUserMfaRow(userId, { backupCodesSalt: salt })
}

export async function tryConsumeBackupCode(userId: string, codeHash: string): Promise<boolean> {
  const db = getDb()
  const r = await db.execute({
    sql: `SELECT "id" FROM "UserBackupCode" WHERE "userId" = ? AND "codeHash" = ? AND "usedAt" IS NULL LIMIT 1`,
    args: [userId, codeHash],
  })
  const row = r.rows[0] as unknown as { id?: string } | undefined
  if (!row?.id) return false
  await db.execute({
    sql: `UPDATE "UserBackupCode" SET "usedAt" = datetime('now') WHERE "id" = ?`,
    args: [String(row.id)],
  })
  return true
}

export async function mfaFailIncrementAndCheckRevoke(params: {
  userId: string
  clientIp: string
  nowSec: number
}): Promise<{ revoke: boolean; userCount: number; ipCount: number }> {
  const db = getDb()
  const w = rateLimitBucketStart(params.nowSec, MFA_RATE_WINDOW_SEC)
  const userKey = `mfa:user:${params.userId}`
  const ipKey = mfaRateLimitIpKey(params.clientIp)

  async function bump(key: string): Promise<number> {
    await db.execute({
      sql: `INSERT INTO "RateLimitBucket" ("bucketKey","windowStart","count") VALUES (?,?,1)
            ON CONFLICT("bucketKey","windowStart") DO UPDATE SET "count" = "count" + 1`,
      args: [key, w],
    })
    const r = await db.execute({
      sql: `SELECT "count" FROM "RateLimitBucket" WHERE "bucketKey" = ? AND "windowStart" = ?`,
      args: [key, w],
    })
    const row = r.rows[0] as unknown as { count?: number | bigint } | undefined
    const c = row?.count
    return typeof c === 'bigint' ? Number(c) : Number(c ?? 0)
  }

  const userCount = await bump(userKey)
  const ipCount = await bump(ipKey)
  const revoke = userCount >= MFA_RATE_MAX_FAIL || ipCount >= MFA_RATE_MAX_FAIL
  return { revoke, userCount, ipCount }
}

export function newRecoveryPlainToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashRecoveryToken(plain: string): string {
  return createHash('sha256').update(plain, 'utf8').digest('hex')
}

export async function insertMfaRecoveryToken(userId: string, tokenHash: string, expiresAtIso: string): Promise<void> {
  const db = getDb()
  await db.execute({ sql: `DELETE FROM "MfaRecoveryToken" WHERE "userId" = ?`, args: [userId] })
  const id = newId()
  await db.execute({
    sql: `INSERT INTO "MfaRecoveryToken" ("id","userId","tokenHash","expiresAt","createdAt") VALUES (?,?,?,?,datetime('now'))`,
    args: [id, userId, tokenHash, expiresAtIso],
  })
}

export async function consumeMfaRecoveryToken(tokenHash: string): Promise<string | null> {
  const db = getDb()
  const r = await db.execute({
    sql: `SELECT "id","userId","expiresAt","usedAt" FROM "MfaRecoveryToken" WHERE "tokenHash" = ? LIMIT 1`,
    args: [tokenHash],
  })
  const row = r.rows[0] as unknown as Record<string, unknown> | undefined
  if (!row) return null
  if (row.usedAt != null) return null
  const exp = new Date(String(row.expiresAt)).getTime()
  if (!Number.isFinite(exp) || exp < Date.now()) return null
  const userId = String(row.userId)
  const id = String(row.id)
  await db.execute({
    sql: `UPDATE "MfaRecoveryToken" SET "usedAt" = datetime('now') WHERE "id" = ?`,
    args: [id],
  })
  return userId
}

export async function insertSecurityAudit(userId: string | null, kind: string, meta: string | null): Promise<void> {
  const db = getDb()
  const id = newId()
  await db.execute({
    sql: `INSERT INTO "SecurityAuditEvent" ("id","userId","kind","meta","createdAt") VALUES (?,?,?,?,datetime('now'))`,
    args: [id, userId, kind, meta],
  })
}

export async function nuclearMfaRecoveryForUser(userId: string): Promise<void> {
  await deleteAllWebAuthnCredentialsForUser(userId)
  await deleteUserMfaData(userId)
  await incrementUserCredentialVersion(userId)
  const db = getDb()
  await db.execute({ sql: `DELETE FROM "Session" WHERE "userId" = ?`, args: [userId] })
}
