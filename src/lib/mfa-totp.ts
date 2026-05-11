import { authenticator } from 'otplib'
import { getDb } from '@/lib/db'

authenticator.options = { step: 30, window: 1 }

export function newTotpSecret(): string {
  return authenticator.generateSecret()
}

export async function resolveTotpIssuer(): Promise<string> {
  const env = process.env.MFA_TOTP_ISSUER?.trim()
  if (env) return env
  try {
    const db = getDb()
    const r = await db.execute({
      sql: `SELECT "value" FROM "SystemConfig" WHERE "key" = ? LIMIT 1`,
      args: ['site_name'],
    })
    const row = r.rows[0] as unknown as { value?: string } | undefined
    const v = row?.value?.trim()
    if (v) return v
  } catch {
    /* ignore */
  }
  return 'Console'
}

export function buildTotpAuthUri(params: { secret: string; issuer: string; accountEmail: string }): string {
  return authenticator.keyuri(params.accountEmail, params.issuer, params.secret)
}

export function verifyTotp(secret: string, token: string): boolean {
  const clean = token.replace(/\s+/g, '')
  if (!/^\d{6}$/.test(clean)) return false
  try {
    return authenticator.verify({ token: clean, secret })
  } catch {
    return false
  }
}
