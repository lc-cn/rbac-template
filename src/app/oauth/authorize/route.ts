import { NextRequest, NextResponse } from 'next/server'
import { getServerAuthSession } from '@/lib/session'
import { validateAuthorizeSearchParams } from '@/lib/oauth2/validate-authorize'

/**
 * OAuth2 授权端点（授权码模式）。
 * 已登录用户进入同意页；未登录由中间件重定向到登录后再回到本端点。
 * @see RFC 6749 §4.1.1
 */
export async function GET(req: NextRequest) {
  const validated = await validateAuthorizeSearchParams(req.nextUrl.searchParams)
  if (!validated.ok) return validated.response

  const session = await getServerAuthSession()
  if (!session?.user?.id) {
    const login = new URL('/login', req.nextUrl.origin)
    login.searchParams.set('callbackUrl', `${req.nextUrl.pathname}${req.nextUrl.search}`)
    return NextResponse.redirect(login)
  }
  if (session.mfaPending) {
    const mfa = new URL('/mfa', req.nextUrl.origin)
    mfa.searchParams.set('callbackUrl', `${req.nextUrl.pathname}${req.nextUrl.search}`)
    return NextResponse.redirect(mfa)
  }

  const consent = new URL('/oauth/consent', req.nextUrl.origin)
  consent.search = req.nextUrl.search
  return NextResponse.redirect(consent)
}
