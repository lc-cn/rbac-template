import bcrypt from 'bcryptjs'
import { getDb, newId, nowIso } from '@/lib/db'

export type OAuth2ClientRow = {
  id: string
  clientId: string
  clientSecretHash: string | null
  name: string
  redirectUrisJson: string
  allowedScopes: string
  createdAt: string
  updatedAt: string
}

export function parseRedirectUris(json: string): string[] {
  try {
    const arr = JSON.parse(json) as unknown
    if (!Array.isArray(arr)) return []
    return arr.filter((x): x is string => typeof x === 'string')
  } catch {
    return []
  }
}

export function redirectUriAllowed(redirectUri: string, uris: string[]): boolean {
  return uris.some((u) => u === redirectUri)
}

export async function getOAuth2ClientByClientId(clientId: string): Promise<OAuth2ClientRow | null> {
  const db = getDb()
  const r = await db.execute({ sql: `SELECT * FROM "OAuth2Client" WHERE "clientId" = ?`, args: [clientId] })
  const row = r.rows[0] as unknown as Record<string, unknown> | undefined
  if (!row) return null
  return {
    id: String(row.id),
    clientId: String(row.clientId),
    clientSecretHash: row.clientSecretHash == null ? null : String(row.clientSecretHash),
    name: String(row.name),
    redirectUrisJson: String(row.redirectUrisJson),
    allowedScopes: String(row.allowedScopes),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  }
}

export function verifyClientSecret(row: OAuth2ClientRow, plainSecret: string | null): boolean {
  if (!row.clientSecretHash) return false
  if (!plainSecret) return false
  return bcrypt.compareSync(plainSecret, row.clientSecretHash)
}

export function isPublicClient(row: OAuth2ClientRow): boolean {
  return row.clientSecretHash == null || row.clientSecretHash === ''
}

export function scopesAllowed(requested: string, allowed: string): boolean {
  const req = requested.split(/\s+/).filter(Boolean)
  const allow = new Set(allowed.split(/\s+/).filter(Boolean))
  return req.every((s) => allow.has(s))
}

export async function insertAuthorizationCode(params: {
  code: string
  clientId: string
  userId: string
  redirectUri: string
  scope: string
  expiresAtIso: string
  codeChallenge: string | null
  codeChallengeMethod: string | null
  nonce: string | null
}) {
  const db = getDb()
  const id = newId()
  await db.execute({
    sql: `INSERT INTO "OAuth2AuthorizationCode" ("id","code","clientId","userId","redirectUri","scope","expiresAt","codeChallenge","codeChallengeMethod","nonce")
          VALUES (?,?,?,?,?,?,?,?,?,?)`,
    args: [
      id,
      params.code,
      params.clientId,
      params.userId,
      params.redirectUri,
      params.scope,
      params.expiresAtIso,
      params.codeChallenge,
      params.codeChallengeMethod,
      params.nonce,
    ],
  })
}

export type ConsumedCode = {
  clientId: string
  userId: string
  redirectUri: string
  scope: string
  codeChallenge: string | null
  codeChallengeMethod: string | null
  nonce: string | null
}

export async function consumeAuthorizationCode(code: string): Promise<ConsumedCode | null> {
  const db = getDb()
  const now = nowIso()
  const sel = await db.execute({
    sql: `SELECT * FROM "OAuth2AuthorizationCode" WHERE "code" = ? AND "expiresAt" > ?`,
    args: [code, now],
  })
  const row = sel.rows[0] as unknown as Record<string, unknown> | undefined
  if (!row) return null
  await db.execute({ sql: `DELETE FROM "OAuth2AuthorizationCode" WHERE "code" = ?`, args: [code] })
  return {
    clientId: String(row.clientId),
    userId: String(row.userId),
    redirectUri: String(row.redirectUri),
    scope: String(row.scope),
    codeChallenge: row.codeChallenge == null ? null : String(row.codeChallenge),
    codeChallengeMethod: row.codeChallengeMethod == null ? null : String(row.codeChallengeMethod),
    nonce: row.nonce == null ? null : String(row.nonce),
  }
}

export async function getUserClaimsForToken(userId: string): Promise<{
  sub: string
  email?: string
  name?: string
  picture?: string
} | null> {
  const db = getDb()
  const r = await db.execute({
    sql: `SELECT "id","email","name","image","avatar" FROM "User" WHERE "id" = ? AND "status" = 1`,
    args: [userId],
  })
  const row = r.rows[0] as unknown as Record<string, unknown> | undefined
  if (!row) return null
  const image = row.image == null ? null : String(row.image)
  const avatar = row.avatar == null ? null : String(row.avatar)
  return {
    sub: String(row.id),
    email: String(row.email),
    name: String(row.name),
    picture: image || avatar || undefined,
  }
}
