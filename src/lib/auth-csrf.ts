import { createHash } from 'node:crypto'
import { getAuthSecret } from '@/lib/auth-secret'

function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {}
  if (!header) return out
  for (const part of header.split(';')) {
    const i = part.indexOf('=')
    if (i === -1) continue
    const k = part.slice(0, i).trim()
    const v = part.slice(i + 1).trim()
    if (!k) continue
    try {
      out[k] = decodeURIComponent(v)
    } catch {
      out[k] = v
    }
  }
  return out
}

function csrfExpectedHash(token: string): string {
  return createHash('sha256').update(`${token}${getAuthSecret()}`).digest('hex')
}

/** 校验 Auth.js 双提交 CSRF：cookie 值须为 `token|hash`，body 带同名 token */
export function verifyAuthCsrf(cookieHeader: string | null, bodyToken: string | null | undefined): boolean {
  if (!bodyToken || typeof bodyToken !== 'string') return false
  const cookies = parseCookies(cookieHeader)
  const name = Object.keys(cookies).find((k) => k.includes('authjs.csrf-token'))
  if (!name) return false
  const raw = cookies[name]
  if (!raw || !raw.includes('|')) return false
  const [csrfToken, csrfTokenHash] = raw.split('|')
  if (!csrfToken || !csrfTokenHash) return false
  if (csrfTokenHash !== csrfExpectedHash(csrfToken)) return false
  return csrfToken === bodyToken
}
