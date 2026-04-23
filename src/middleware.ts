import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export default auth((req) => {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }
  if (pathname.startsWith('/.well-known')) {
    return NextResponse.next()
  }
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

  const isLogin = pathname === '/login'
  const token = req.auth

  if (!token?.user && !isLogin) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('callbackUrl', pathname + req.nextUrl.search)
    return NextResponse.redirect(url)
  }

  if (token?.user && isLogin) {
    const url = req.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.delete('callbackUrl')
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
