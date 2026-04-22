import { NextRequest, NextResponse } from 'next/server'
import {
  consumeAuthorizationCode,
  getOAuth2ClientByClientId,
  getUserClaimsForToken,
  isPublicClient,
  verifyClientSecret,
} from '@/lib/oauth2/store'
import { verifyPkceS256 } from '@/lib/oauth2/pkce'
import { signAccessToken, signIdToken } from '@/lib/oauth2/jwt-as'

function jsonError(status: number, error: string, description?: string) {
  const b: Record<string, string> = { error }
  if (description) b.error_description = description
  return NextResponse.json(b, { status, headers: { 'Cache-Control': 'no-store' } })
}

function parseBasicAuth(header: string | null): { id: string; secret: string } | null {
  if (!header?.startsWith('Basic ')) return null
  const decoded = Buffer.from(header.slice(6).trim(), 'base64').toString('utf8')
  const idx = decoded.indexOf(':')
  if (idx < 0) return null
  return { id: decoded.slice(0, idx), secret: decoded.slice(idx + 1) }
}

/**
 * OAuth2 令牌端点（授权码换 token）。
 * @see RFC 6749 §4.1.3、OpenID Connect Core
 */
export async function POST(req: NextRequest) {
  let body: URLSearchParams
  try {
    const text = await req.text()
    body = new URLSearchParams(text)
  } catch {
    return jsonError(400, 'invalid_request', '无法解析请求体')
  }

  const grantType = body.get('grant_type')
  if (grantType !== 'authorization_code') {
    return jsonError(400, 'unsupported_grant_type')
  }

  const code = body.get('code')
  const redirectUri = body.get('redirect_uri')
  let clientId = body.get('client_id')
  let clientSecret = body.get('client_secret')
  const codeVerifier = body.get('code_verifier')

  const basic = parseBasicAuth(req.headers.get('authorization'))
  if (basic) {
    clientId = clientId || basic.id
    clientSecret = clientSecret || basic.secret
  }

  if (!code || !redirectUri || !clientId) {
    return jsonError(400, 'invalid_request', '缺少 code、redirect_uri 或 client_id')
  }

  const client = await getOAuth2ClientByClientId(clientId)
  if (!client) return jsonError(400, 'invalid_client')

  const consumed = await consumeAuthorizationCode(code)
  if (!consumed) {
    return jsonError(400, 'invalid_grant', '授权码无效或已使用')
  }
  if (consumed.clientId !== clientId || consumed.redirectUri !== redirectUri) {
    return jsonError(400, 'invalid_grant', 'client_id 或 redirect_uri 与授权时不一致')
  }

  const pub = isPublicClient(client)
  if (pub) {
    if (!codeVerifier) {
      return jsonError(400, 'invalid_grant', '公开客户端须提交 code_verifier（PKCE）')
    }
    if (!consumed.codeChallenge || consumed.codeChallengeMethod !== 'S256') {
      return jsonError(400, 'invalid_grant', '授权码缺少 PKCE 绑定')
    }
    if (!verifyPkceS256(codeVerifier, consumed.codeChallenge)) {
      return jsonError(400, 'invalid_grant', 'code_verifier 校验失败')
    }
  } else {
    if (!verifyClientSecret(client, clientSecret)) {
      return jsonError(401, 'invalid_client', 'client_secret 不正确或未提供')
    }
    if (consumed.codeChallenge) {
      if (!codeVerifier || !verifyPkceS256(codeVerifier, consumed.codeChallenge)) {
        return jsonError(400, 'invalid_grant', 'PKCE code_verifier 校验失败')
      }
    }
  }

  const claims = await getUserClaimsForToken(consumed.userId)
  if (!claims) {
    return jsonError(400, 'invalid_grant', '用户不可用')
  }

  const scope = consumed.scope
  const wantIdToken = /\bopenid\b/.test(scope)

  const accessToken = await signAccessToken({
    sub: claims.sub,
    aud: client.clientId,
    scope,
  })

  let idToken: string | undefined
  if (wantIdToken) {
    const idPayload: Parameters<typeof signIdToken>[0] = {
      sub: claims.sub,
      aud: client.clientId,
      nonce: consumed.nonce,
    }
    if (/\bemail\b/.test(scope) && claims.email) idPayload.email = claims.email
    if (/\bprofile\b/.test(scope)) {
      if (claims.name) idPayload.name = claims.name
      if (claims.picture) idPayload.picture = claims.picture
    }
    idToken = await signIdToken(idPayload)
  }

  return NextResponse.json(
    {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope,
      ...(idToken ? { id_token: idToken } : {}),
    },
    { headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' } }
  )
}
