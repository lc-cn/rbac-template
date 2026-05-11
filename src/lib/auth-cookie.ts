import type { NextRequest } from 'next/server'

export function sessionCookieSecure(request: NextRequest): boolean {
  const proto = request.headers.get('x-forwarded-proto')
  if (proto === 'https') return true
  return request.nextUrl.protocol === 'https:'
}

export function sessionCookieName(secure: boolean): string {
  return secure ? '__Secure-authjs.session-token' : 'authjs.session-token'
}
