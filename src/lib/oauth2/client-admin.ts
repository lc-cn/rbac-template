import { randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { getDb, isUniqueConstraintError, newId, nowIso } from '@/lib/db'
import { mapOAuth2ClientRow, parseGrantTypesCsv, parseRedirectUris, type OAuth2ClientRow } from '@/lib/oauth2/store'

export type OAuth2ClientAdminDto = {
  id: string
  clientId: string
  name: string
  redirectUris: string[]
  postLogoutRedirectUris: string[]
  allowedScopes: string
  isPublic: boolean
  logoUrl: string | null
  clientUri: string | null
  policyUri: string | null
  tosUri: string | null
  jwksUri: string | null
  grantAuthorizationCode: boolean
  grantRefreshToken: boolean
  accessTokenTtlSeconds: number
  refreshTokenTtlDays: number
  authorizationCodeTtlMinutes: number
  createdAt: string
  updatedAt: string
}

function grantsToCsv(grantRefresh: boolean): string {
  return grantRefresh ? 'authorization_code,refresh_token' : 'authorization_code'
}

function normAccessTtl(v: unknown, fallback: number): number {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : Number(v)
  const x = Number.isFinite(n) ? Math.floor(n) : fallback
  return Math.min(86400, Math.max(300, x))
}

function normRefreshDays(v: unknown, fallback: number): number {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : Number(v)
  const x = Number.isFinite(n) ? Math.floor(n) : fallback
  return Math.min(365, Math.max(1, x))
}

function normCodeMin(v: unknown, fallback: number): number {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : Number(v)
  const x = Number.isFinite(n) ? Math.floor(n) : fallback
  return Math.min(60, Math.max(1, x))
}

function toDto(row: OAuth2ClientRow): OAuth2ClientAdminDto {
  const g = parseGrantTypesCsv(row.allowedGrantTypes)
  return {
    id: row.id,
    clientId: row.clientId,
    name: row.name,
    redirectUris: parseRedirectUris(row.redirectUrisJson),
    postLogoutRedirectUris: parseRedirectUris(row.postLogoutRedirectUrisJson || '[]'),
    allowedScopes: row.allowedScopes,
    isPublic: !row.clientSecretHash || row.clientSecretHash === '',
    logoUrl: row.logoUrl,
    clientUri: row.clientUri,
    policyUri: row.policyUri,
    tosUri: row.tosUri,
    jwksUri: row.jwksUri,
    grantAuthorizationCode: true,
    grantRefreshToken: g.has('refresh_token'),
    accessTokenTtlSeconds: normAccessTtl(row.accessTokenTtlSeconds, 3600),
    refreshTokenTtlDays: normRefreshDays(row.refreshTokenTtlDays, 30),
    authorizationCodeTtlMinutes: normCodeMin(row.authorizationCodeTtlMinutes, 10),
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
  return r.rows.map((raw) => toDto(mapOAuth2ClientRow(raw as unknown as Record<string, unknown>)))
}

export async function getOAuth2ClientAdminById(id: string): Promise<OAuth2ClientAdminDto | null> {
  const db = getDb()
  const r = await db.execute({ sql: `SELECT * FROM "OAuth2Client" WHERE "id" = ?`, args: [id] })
  const row = r.rows[0] as unknown as Record<string, unknown> | undefined
  if (!row) return null
  return toDto(mapOAuth2ClientRow(row))
}

function normalizeRedirectUris(uris: unknown): string[] {
  if (!Array.isArray(uris)) return []
  return uris.filter((u): u is string => typeof u === 'string' && u.trim().length > 0).map((u) => u.trim())
}

function normalizeOptionalUrl(s: unknown): string | null {
  if (s == null) return null
  const t = String(s).trim()
  return t.length ? t : null
}

export async function createOAuth2ClientAdmin(input: {
  name: string
  clientId?: string
  redirectUris: unknown
  postLogoutRedirectUris?: unknown
  allowedScopes: string
  confidential: boolean
  plainSecret?: string | null
  logoUrl?: string | null
  clientUri?: string | null
  policyUri?: string | null
  tosUri?: string | null
  jwksUri?: string | null
  grantRefreshToken?: boolean
  accessTokenTtlSeconds?: number
  refreshTokenTtlDays?: number
  authorizationCodeTtlMinutes?: number
}): Promise<{ dto: OAuth2ClientAdminDto; plainSecret: string | null }> {
  const name = String(input.name || '').trim()
  if (!name) throw new Error('名称必填')

  const redirectUris = normalizeRedirectUris(input.redirectUris)
  if (!redirectUris.length) throw new Error('至少填写一个回调 URI')

  const postLogoutRedirectUris = normalizeRedirectUris(input.postLogoutRedirectUris ?? [])
  const postLogoutJson = JSON.stringify(postLogoutRedirectUris)

  const allowedScopes = String(input.allowedScopes || '').trim() || 'openid profile email offline_access'
  const clientId =
    String(input.clientId || '')
      .trim()
      .replace(/\s+/g, '') || `oauth_${randomBytes(10).toString('base64url').replace(/=/g, '')}`

  const grantRefresh = Boolean(input.grantRefreshToken)
  const allowedGrantTypes = grantsToCsv(grantRefresh)

  const accessTokenTtlSeconds = normAccessTtl(input.accessTokenTtlSeconds, 3600)
  const refreshTokenTtlDays = normRefreshDays(input.refreshTokenTtlDays, 30)
  const authorizationCodeTtlMinutes = normCodeMin(input.authorizationCodeTtlMinutes, 10)

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

  const logoUrl = normalizeOptionalUrl(input.logoUrl)
  const clientUri = normalizeOptionalUrl(input.clientUri)
  const policyUri = normalizeOptionalUrl(input.policyUri)
  const tosUri = normalizeOptionalUrl(input.tosUri)
  const jwksUri = normalizeOptionalUrl(input.jwksUri)

  try {
    await db.execute({
      sql: `INSERT INTO "OAuth2Client" (
        "id","clientId","clientSecretHash","name","redirectUrisJson","allowedScopes",
        "logoUrl","clientUri","policyUri","tosUri","postLogoutRedirectUrisJson","jwksUri",
        "allowedGrantTypes","accessTokenTtlSeconds","refreshTokenTtlDays","authorizationCodeTtlMinutes",
        "createdAt","updatedAt"
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        id,
        clientId,
        clientSecretHash,
        name,
        redirectUrisJson,
        allowedScopes,
        logoUrl,
        clientUri,
        policyUri,
        tosUri,
        postLogoutJson,
        jwksUri,
        allowedGrantTypes,
        accessTokenTtlSeconds,
        refreshTokenTtlDays,
        authorizationCodeTtlMinutes,
        t,
        t,
      ],
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
    postLogoutRedirectUris?: unknown
    allowedScopes?: string
    confidential?: boolean
    plainSecret?: string | null
    regenerateSecret?: boolean
    logoUrl?: string | null
    clientUri?: string | null
    policyUri?: string | null
    tosUri?: string | null
    jwksUri?: string | null
    grantRefreshToken?: boolean
    accessTokenTtlSeconds?: number
    refreshTokenTtlDays?: number
    authorizationCodeTtlMinutes?: number
  }
): Promise<{ dto: OAuth2ClientAdminDto; plainSecret: string | null }> {
  const existing = await getOAuth2ClientAdminById(id)
  if (!existing) throw new Error('客户端不存在')

  const name = input.name != null ? String(input.name).trim() : existing.name
  if (!name) throw new Error('名称必填')

  const redirectUris =
    input.redirectUris != null ? normalizeRedirectUris(input.redirectUris) : existing.redirectUris
  if (!redirectUris.length) throw new Error('至少填写一个回调 URI')

  const postLogoutRedirectUris =
    input.postLogoutRedirectUris != null
      ? normalizeRedirectUris(input.postLogoutRedirectUris)
      : existing.postLogoutRedirectUris
  const postLogoutJson = JSON.stringify(postLogoutRedirectUris)

  const allowedScopes =
    input.allowedScopes != null
      ? String(input.allowedScopes).trim() || 'openid profile email offline_access'
      : existing.allowedScopes

  const grantRefresh = input.grantRefreshToken ?? existing.grantRefreshToken
  const allowedGrantTypes = grantsToCsv(Boolean(grantRefresh))

  const accessTokenTtlSeconds = normAccessTtl(
    input.accessTokenTtlSeconds !== undefined ? input.accessTokenTtlSeconds : existing.accessTokenTtlSeconds,
    existing.accessTokenTtlSeconds
  )
  const refreshTokenTtlDays = normRefreshDays(
    input.refreshTokenTtlDays !== undefined ? input.refreshTokenTtlDays : existing.refreshTokenTtlDays,
    existing.refreshTokenTtlDays
  )
  const authorizationCodeTtlMinutes = normCodeMin(
    input.authorizationCodeTtlMinutes !== undefined
      ? input.authorizationCodeTtlMinutes
      : existing.authorizationCodeTtlMinutes,
    existing.authorizationCodeTtlMinutes
  )

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

  const logoUrl = input.logoUrl !== undefined ? normalizeOptionalUrl(input.logoUrl) : existing.logoUrl
  const clientUri = input.clientUri !== undefined ? normalizeOptionalUrl(input.clientUri) : existing.clientUri
  const policyUri = input.policyUri !== undefined ? normalizeOptionalUrl(input.policyUri) : existing.policyUri
  const tosUri = input.tosUri !== undefined ? normalizeOptionalUrl(input.tosUri) : existing.tosUri
  const jwksUri = input.jwksUri !== undefined ? normalizeOptionalUrl(input.jwksUri) : existing.jwksUri

  const t = nowIso()
  const redirectUrisJson = JSON.stringify(redirectUris)

  await db.execute({
    sql: `UPDATE "OAuth2Client" SET
      "name"=?,"clientSecretHash"=?,"redirectUrisJson"=?,"allowedScopes"=?,
      "logoUrl"=?,"clientUri"=?,"policyUri"=?,"tosUri"=?,"postLogoutRedirectUrisJson"=?,"jwksUri"=?,
      "allowedGrantTypes"=?,"accessTokenTtlSeconds"=?,"refreshTokenTtlDays"=?,"authorizationCodeTtlMinutes"=?,
      "updatedAt"=?
      WHERE "id"=?`,
    args: [
      name,
      clientSecretHash,
      redirectUrisJson,
      allowedScopes,
      logoUrl,
      clientUri,
      policyUri,
      tosUri,
      postLogoutJson,
      jwksUri,
      allowedGrantTypes,
      accessTokenTtlSeconds,
      refreshTokenTtlDays,
      authorizationCodeTtlMinutes,
      t,
      id,
    ],
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
