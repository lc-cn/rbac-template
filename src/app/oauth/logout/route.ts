import { NextRequest, NextResponse } from 'next/server'
import { getOAuth2ClientByClientId, parseRedirectUris, redirectUriAllowed } from '@/lib/oauth2/store'

/**
 * OIDC RP-Initiated Logout 入口：校验 client 与 post_logout_redirect_uri 后跳转 NextAuth 登出。
 * @see OpenID Connect RP-Initiated Logout 1.0（简化实现）
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const clientId = sp.get('client_id')
  const postLogout = sp.get('post_logout_redirect_uri')
  const state = sp.get('state')

  if (!postLogout?.trim()) {
    const home = new URL('/', req.nextUrl.origin)
    return NextResponse.redirect(home)
  }

  if (!clientId) {
    return NextResponse.json({ error: 'invalid_request', error_description: '缺少 client_id' }, { status: 400 })
  }

  const client = await getOAuth2ClientByClientId(clientId)
  if (!client) {
    return NextResponse.json({ error: 'invalid_client' }, { status: 400 })
  }

  const allowed = parseRedirectUris(client.postLogoutRedirectUrisJson || '[]')
  if (!redirectUriAllowed(postLogout, allowed)) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'post_logout_redirect_uri 未在该客户端登记' },
      { status: 400 }
    )
  }

  let target: URL
  try {
    target = new URL(postLogout)
  } catch {
    return NextResponse.json({ error: 'invalid_request', error_description: 'post_logout_redirect_uri 无效' }, { status: 400 })
  }
  if (state) target.searchParams.set('state', state)

  const signout = new URL('/api/auth/signout', req.nextUrl.origin)
  signout.searchParams.set('callbackUrl', target.toString())
  return NextResponse.redirect(signout)
}
