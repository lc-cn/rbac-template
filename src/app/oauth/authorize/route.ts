import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'
import { getServerAuthSession } from '@/lib/session'
import {
  getOAuth2ClientByClientId,
  insertAuthorizationCode,
  isPublicClient,
  parseRedirectUris,
  redirectUriAllowed,
  scopesAllowed,
} from '@/lib/oauth2/store'
import { verifyPkceS256 } from '@/lib/oauth2/pkce'

function errRedirect(redirectUri: string, error: string, desc: string, state: string | null) {
  const u = new URL(redirectUri)
  u.searchParams.set('error', error)
  u.searchParams.set('error_description', desc)
  if (state) u.searchParams.set('state', state)
  return NextResponse.redirect(u)
}

/**
 * OAuth2 授权端点（授权码模式）。
 * @see RFC 6749 §4.1.1
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const responseType = sp.get('response_type')
  const clientId = sp.get('client_id')
  const redirectUri = sp.get('redirect_uri')
  const scopeRaw = sp.get('scope')?.trim() || 'openid'
  const state = sp.get('state')
  const codeChallenge = sp.get('code_challenge')
  const codeChallengeMethod = sp.get('code_challenge_method')
  const nonce = sp.get('nonce')

  if (responseType !== 'code') {
    return NextResponse.json({ error: 'unsupported_response_type' }, { status: 400 })
  }
  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: 'invalid_request', error_description: '缺少 client_id 或 redirect_uri' }, { status: 400 })
  }

  let client
  try {
    client = await getOAuth2ClientByClientId(clientId)
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
  if (!client) {
    return NextResponse.json({ error: 'invalid_client' }, { status: 400 })
  }

  const uris = parseRedirectUris(client.redirectUrisJson)
  if (!redirectUriAllowed(redirectUri, uris)) {
    return NextResponse.json({ error: 'invalid_request', error_description: 'redirect_uri 未在客户端登记白名单内' }, { status: 400 })
  }

  if (!scopesAllowed(scopeRaw, client.allowedScopes)) {
    return errRedirect(redirectUri, 'invalid_scope', '请求的 scope 超出客户端允许范围', state)
  }

  const pub = isPublicClient(client)
  if (codeChallenge && codeChallengeMethod !== 'S256') {
    return errRedirect(redirectUri, 'invalid_request', '使用 PKCE 时须为 code_challenge_method=S256', state)
  }
  if (pub && !codeChallenge) {
    return errRedirect(redirectUri, 'invalid_request', '公开客户端必须使用 PKCE（code_challenge + code_challenge_method=S256）', state)
  }

  const session = await getServerAuthSession()
  if (!session?.user?.id) {
    const login = new URL('/login', req.nextUrl.origin)
    login.searchParams.set('callbackUrl', `${req.nextUrl.pathname}${req.nextUrl.search}`)
    return NextResponse.redirect(login)
  }

  const code = randomBytes(32).toString('base64url')
  const exp = new Date(Date.now() + 10 * 60 * 1000).toISOString()
  await insertAuthorizationCode({
    code,
    clientId: client.clientId,
    userId: session.user.id as string,
    redirectUri,
    scope: scopeRaw,
    expiresAtIso: exp,
    codeChallenge: codeChallenge || null,
    codeChallengeMethod: codeChallengeMethod || null,
    nonce,
  })

  const ok = new URL(redirectUri)
  ok.searchParams.set('code', code)
  if (state) ok.searchParams.set('state', state)
  return NextResponse.redirect(ok)
}
