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
