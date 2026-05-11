import { NextResponse, type NextRequest } from 'next/server'
import { auth } from '@/auth'

/** 需要当前租户上下文的页面与 API（业务读写区域） */
function pathNeedsTenant(pathname: string): boolean {
  if (pathname.startsWith('/api/')) {
    if (pathname.startsWith('/api/auth')) return false
    if (pathname.startsWith('/api/profile')) return false
    if (pathname.startsWith('/api/platform')) return false
    if (pathname === '/api/tenants' || pathname.startsWith('/api/tenants/')) return false
    return true
  }
  if (
    pathname === '/login' ||
    pathname.startsWith('/docs') ||
    pathname.startsWith('/.well-known') ||
    pathname.startsWith('/oauth/')
  ) {
    return false
  }
  if (
    pathname === '/no-tenant' ||
    pathname === '/profile' ||
    pathname === '/organizations/new' ||
    pathname.startsWith('/platform')
  ) {
    return false
  }
  return true
}

type AuthToken = {
  user?: unknown
  currentTenantId?: string | null
  isPlatformAdmin?: boolean
}

// Lazy `NextAuth(async () => …)` makes `auth(mw)` return Promise<handler>; Next requires `proxy` to be a function.
const withAuth = auth((req) => {
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
  const token = req.auth as AuthToken | null | undefined

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

  if (!token?.user) {
    return NextResponse.next()
  }

  const currentTenantId = token.currentTenantId ?? null
  const isPlatformAdmin = !!token.isPlatformAdmin
  const needsTenant = pathNeedsTenant(pathname)

  if (needsTenant && !currentTenantId) {
    if (isPlatformAdmin) {
      const url = req.nextUrl.clone()
      url.pathname = '/platform'
      url.search = ''
      return NextResponse.redirect(url)
    }
    const url = req.nextUrl.clone()
    url.pathname = '/no-tenant'
    url.search = ''
    return NextResponse.redirect(url)
  }

  if (pathname === '/no-tenant' && currentTenantId) {
    const url = req.nextUrl.clone()
    url.pathname = '/'
    url.search = ''
    return NextResponse.redirect(url)
  }

  const isPlatformZone =
    pathname === '/platform' ||
    pathname.startsWith('/platform/') ||
    pathname.startsWith('/api/platform')
  if (isPlatformZone && !isPlatformAdmin) {
    const url = req.nextUrl.clone()
    url.pathname = '/'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
})

type AuthHandler = Awaited<typeof withAuth>

export async function proxy(request: NextRequest, context: Parameters<AuthHandler>[1]) {
  const handle = await withAuth
  return handle(request, context)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
