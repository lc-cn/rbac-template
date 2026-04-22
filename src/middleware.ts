import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuthSecret } from '@/lib/auth-secret'

export async function middleware(req: NextRequest) {
  const secret = getAuthSecret()

  const { pathname } = req.nextUrl
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }
  // 自建 OAuth2/OIDC：令牌与元数据端点不依赖本站登录 Cookie
  if (pathname.startsWith('/.well-known')) {
    return NextResponse.next()
  }
  // 对外技术文档（OAuth2 对接说明），无需登录
  if (pathname.startsWith('/docs')) {
    return NextResponse.next()
  }
  if (
    pathname === '/oauth/token' ||
    pathname === '/oauth/userinfo' ||
    pathname === '/oauth/revoke' ||
    pathname === '/oauth/introspect' ||
    pathname === '/oauth/logout'
  ) {
    return NextResponse.next()
  }

  const token = await getToken({ req, secret })
  const isLogin = pathname === '/login'

  if (!token && !isLogin) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('callbackUrl', pathname + req.nextUrl.search)
    return NextResponse.redirect(url)
  }

  if (token && isLogin) {
    const url = req.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.delete('callbackUrl')
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
