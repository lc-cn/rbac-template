import type { NextResponse } from 'next/server'
import { encode } from 'next-auth/jwt'
import { getAuthSecret } from '@/lib/auth-secret'
import { sessionCookieName } from '@/lib/auth-cookie'

const SESSION_MAX_AGE = 60 * 60 * 24 * 7

export async function setSessionTokenOnResponse(
  res: NextResponse,
  tokenPayload: Record<string, unknown>,
  opts: { secure: boolean; maxAgeSec: number }
): Promise<void> {
  const salt = sessionCookieName(opts.secure)
  let maxAge = opts.maxAgeSec
  const deadline = tokenPayload.mfaDeadline
  if (tokenPayload.mfaPending === true && typeof deadline === 'number') {
    maxAge = Math.max(1, deadline - Math.floor(Date.now() / 1000))
  }
  const jwt = await encode({
    token: tokenPayload,
    secret: getAuthSecret(),
    maxAge,
    salt,
  })
  res.cookies.set(salt, jwt, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: opts.secure,
    maxAge,
  })
}

export function clearSessionCookieOnResponse(res: NextResponse, secure: boolean): void {
  const salt = sessionCookieName(secure)
  res.cookies.set(salt, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure,
    maxAge: 0,
  })
}

export { SESSION_MAX_AGE }
