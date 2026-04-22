import { randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { getDb, isUniqueConstraintError, newId, nowIso } from '@/lib/db'
import { parseRedirectUris, type OAuth2ClientRow } from '@/lib/oauth2/store'

export type OAuth2ClientAdminDto = {
  id: string
  clientId: string
  name: string
  redirectUris: string[]
  allowedScopes: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

function rowFromRecord(row: Record<string, unknown>): OAuth2ClientRow {
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

function toDto(row: OAuth2ClientRow): OAuth2ClientAdminDto {
  return {
    id: row.id,
    clientId: row.clientId,
    name: row.name,
    redirectUris: parseRedirectUris(row.redirectUrisJson),
    allowedScopes: row.allowedScopes,
    isPublic: !row.clientSecretHash || row.clientSecretHash === '',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export async function listOAuth2ClientsAdmin(): Promise<OAuth2ClientAdminDto[]> {
  const db = getDb()
  const r = await db.execute({
    sql: `SELECT * FROM "OAuth2Client" ORDER BY "createdAt" DESC`,
    args: [],
  })
  return r.rows.map((raw) => toDto(rowFromRecord(raw as unknown as Record<string, unknown>)))
}

export async function getOAuth2ClientAdminById(id: string): Promise<OAuth2ClientAdminDto | null> {
  const db = getDb()
  const r = await db.execute({ sql: `SELECT * FROM "OAuth2Client" WHERE "id" = ?`, args: [id] })
  const row = r.rows[0] as unknown as Record<string, unknown> | undefined
  if (!row) return null
  return toDto(rowFromRecord(row))
}

function normalizeRedirectUris(uris: unknown): string[] {
  if (!Array.isArray(uris)) return []
  return uris.filter((u): u is string => typeof u === 'string' && u.trim().length > 0).map((u) => u.trim())
}

export async function createOAuth2ClientAdmin(input: {
  name: string
  clientId?: string
  redirectUris: unknown
  allowedScopes: string
  confidential: boolean
  plainSecret?: string | null
}): Promise<{ dto: OAuth2ClientAdminDto; plainSecret: string | null }> {
  const name = String(input.name || '').trim()
  if (!name) throw new Error('名称必填')

  const redirectUris = normalizeRedirectUris(input.redirectUris)
  if (!redirectUris.length) throw new Error('至少填写一个回调 URI')

  const allowedScopes = String(input.allowedScopes || '').trim() || 'openid profile email offline_access'
  const clientId =
    String(input.clientId || '')
      .trim()
      .replace(/\s+/g, '') || `oauth_${randomBytes(10).toString('base64url').replace(/=/g, '')}`

  let clientSecretHash: string | null = null
  let plainSecret: string | null = null
  if (input.confidential) {
    plainSecret =
      (input.plainSecret && String(input.plainSecret).trim()) ||
      randomBytes(32).toString('base64url')
    clientSecretHash = bcrypt.hashSync(plainSecret, 10)
  }

  const db = getDb()
  const id = newId()
  const t = nowIso()
  const redirectUrisJson = JSON.stringify(redirectUris)

  try {
    await db.execute({
      sql: `INSERT INTO "OAuth2Client" ("id","clientId","clientSecretHash","name","redirectUrisJson","allowedScopes","createdAt","updatedAt")
            VALUES (?,?,?,?,?,?,?,?)`,
      args: [id, clientId, clientSecretHash, name, redirectUrisJson, allowedScopes, t, t],
    })
  } catch (e) {
    if (isUniqueConstraintError(e)) throw new Error('client_id 已存在')
    throw e
  }

  const dto = await getOAuth2ClientAdminById(id)
  if (!dto) throw new Error('创建后读取失败')
  return { dto, plainSecret: input.confidential ? plainSecret : null }
}

export async function updateOAuth2ClientAdmin(
  id: string,
  input: {
    name?: string
    redirectUris?: unknown
    allowedScopes?: string
    confidential?: boolean
    plainSecret?: string | null
    regenerateSecret?: boolean
  }
): Promise<{ dto: OAuth2ClientAdminDto; plainSecret: string | null }> {
  const existing = await getOAuth2ClientAdminById(id)
  if (!existing) throw new Error('客户端不存在')

  const name = input.name != null ? String(input.name).trim() : existing.name
  if (!name) throw new Error('名称必填')

  const redirectUris =
    input.redirectUris != null ? normalizeRedirectUris(input.redirectUris) : existing.redirectUris
  if (!redirectUris.length) throw new Error('至少填写一个回调 URI')

  const allowedScopes =
    input.allowedScopes != null
      ? String(input.allowedScopes).trim() || 'openid profile email offline_access'
      : existing.allowedScopes

  const wantConfidential = input.confidential ?? !existing.isPublic
  let clientSecretHash: string | null = null
  let plainSecret: string | null = null

  const db = getDb()
  const cur = await db.execute({ sql: `SELECT "clientSecretHash" FROM "OAuth2Client" WHERE "id" = ?`, args: [id] })
  const curRow = cur.rows[0] as unknown as Record<string, unknown> | undefined
  const curHash = curRow?.clientSecretHash == null ? null : String(curRow.clientSecretHash)

  if (wantConfidential) {
    if (input.regenerateSecret || (input.plainSecret != null && String(input.plainSecret).trim())) {
      plainSecret = String(input.plainSecret || '').trim() || randomBytes(32).toString('base64url')
      clientSecretHash = bcrypt.hashSync(plainSecret, 10)
    } else if (curHash) {
      clientSecretHash = curHash
    } else {
      plainSecret = randomBytes(32).toString('base64url')
      clientSecretHash = bcrypt.hashSync(plainSecret, 10)
    }
  }

  const t = nowIso()
  const redirectUrisJson = JSON.stringify(redirectUris)

  await db.execute({
    sql: `UPDATE "OAuth2Client" SET "name"=?,"clientSecretHash"=?,"redirectUrisJson"=?,"allowedScopes"=?,"updatedAt"=? WHERE "id"=?`,
    args: [name, clientSecretHash, redirectUrisJson, allowedScopes, t, id],
  })

  const dto = await getOAuth2ClientAdminById(id)
  if (!dto) throw new Error('更新后读取失败')
  return { dto, plainSecret }
}

export async function deleteOAuth2ClientAdmin(id: string): Promise<boolean> {
  const db = getDb()
  const sel = await db.execute({ sql: `SELECT 1 FROM "OAuth2Client" WHERE "id" = ?`, args: [id] })
  if (!sel.rows[0]) return false
  await db.execute({ sql: `DELETE FROM "OAuth2Client" WHERE "id" = ?`, args: [id] })
  return true
}
