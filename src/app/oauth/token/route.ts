import { NextRequest, NextResponse } from 'next/server'
import {
  clampAccessTokenTtlSeconds,
  clampRefreshTokenTtlDays,
  clientAllowsGrant,
  consumeAuthorizationCode,
  getOAuth2ClientByClientId,
  getUserClaimsForToken,
  insertRefreshTokenRow,
  isPublicClient,
  newRefreshTokenPlain,
  takeRefreshTokenForRotation,
  verifyClientSecret,
  type OAuth2ClientRow,
} from '@/lib/oauth2/store'
import { verifyPkceS256 } from '@/lib/oauth2/pkce'
import { signAccessToken, signIdToken } from '@/lib/oauth2/jwt-as'
import { tenantArchivedBlocksOAuthIssuance } from '@/lib/tenant-lifecycle'

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

async function resolveClientAuth(req: NextRequest, body: URLSearchParams) {
  let clientId = body.get('client_id')
  let clientSecret = body.get('client_secret')
  const basic = parseBasicAuth(req.headers.get('authorization'))
  if (basic) {
    clientId = clientId || basic.id
    clientSecret = clientSecret || basic.secret
  }
  return { clientId, clientSecret }
}

async function issueAccessAndId(
  client: OAuth2ClientRow,
  userId: string,
  scope: string,
  nonce: string | null
) {
  const claims = await getUserClaimsForToken(userId)
  if (!claims) return null

  const accessTtl = clampAccessTokenTtlSeconds(client)
  const accessToken = await signAccessToken({
    sub: claims.sub,
    aud: client.clientId,
    scope,
    expiresInSeconds: accessTtl,
  })

  const wantIdToken = /\bopenid\b/.test(scope)
  let idToken: string | undefined
  if (wantIdToken) {
    const idPayload: Parameters<typeof signIdToken>[0] = {
      sub: claims.sub,
      aud: client.clientId,
      nonce,
      expiresInSeconds: accessTtl,
    }
    if (/\bemail\b/.test(scope) && claims.email) idPayload.email = claims.email
    if (/\bprofile\b/.test(scope)) {
      if (claims.name) idPayload.name = claims.name
      if (claims.picture) idPayload.picture = claims.picture
    }
    idToken = await signIdToken(idPayload)
  }

  return { accessToken, idToken, scope, claims, expiresIn: accessTtl }
}

async function maybeIssueRefreshToken(client: OAuth2ClientRow, userId: string, scope: string) {
  if (!/\boffline_access\b/.test(scope)) return undefined
  if (!clientAllowsGrant(client, 'refresh_token')) return undefined
  const plain = newRefreshTokenPlain()
  const days = clampRefreshTokenTtlDays(client)
  const exp = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
  await insertRefreshTokenRow({
    plainToken: plain,
    clientId: client.clientId,
    userId,
    scope,
    expiresAtIso: exp,
  })
  return plain
}

async function handleAuthorizationCode(req: NextRequest, body: URLSearchParams) {
  const code = body.get('code')
  const redirectUri = body.get('redirect_uri')
  const { clientId, clientSecret } = await resolveClientAuth(req, body)
  const codeVerifier = body.get('code_verifier')

  if (!code || !redirectUri || !clientId) {
    return jsonError(400, 'invalid_request', '缺少 code、redirect_uri 或 client_id')
  }

  const client = await getOAuth2ClientByClientId(clientId)
  if (!client) return jsonError(400, 'invalid_client')
  if (
    client.applicationTenantId &&
    (await tenantArchivedBlocksOAuthIssuance(client.applicationTenantId))
  ) {
    return jsonError(400, 'invalid_grant', '租户已归档')
  }
  if (!clientAllowsGrant(client, 'authorization_code')) {
    return jsonError(400, 'unauthorized_client', '该客户端未启用授权码流程')
  }

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

  const bundle = await issueAccessAndId(client, consumed.userId, consumed.scope, consumed.nonce)
  if (!bundle) return jsonError(400, 'invalid_grant', '用户不可用')

  const refreshToken = await maybeIssueRefreshToken(client, bundle.claims.sub, bundle.scope)

  return NextResponse.json(
    {
      access_token: bundle.accessToken,
      token_type: 'Bearer',
      expires_in: bundle.expiresIn,
      scope: bundle.scope,
      ...(bundle.idToken ? { id_token: bundle.idToken } : {}),
      ...(refreshToken ? { refresh_token: refreshToken } : {}),
    },
    { headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' } }
  )
}

async function handleRefreshToken(req: NextRequest, body: URLSearchParams) {
  const refreshToken = body.get('refresh_token')
  const { clientId, clientSecret } = await resolveClientAuth(req, body)

  if (!refreshToken || !clientId) {
    return jsonError(400, 'invalid_request', '缺少 refresh_token 或 client_id')
  }

  const client = await getOAuth2ClientByClientId(clientId)
  if (!client) return jsonError(400, 'invalid_client')
  if (
    client.applicationTenantId &&
    (await tenantArchivedBlocksOAuthIssuance(client.applicationTenantId))
  ) {
    return jsonError(400, 'invalid_grant', '租户已归档')
  }
  if (!clientAllowsGrant(client, 'refresh_token')) {
    return jsonError(400, 'unauthorized_client', '该客户端未启用 refresh_token 授权')
  }

  const pub = isPublicClient(client)
  if (!pub && !verifyClientSecret(client, clientSecret)) {
    return jsonError(401, 'invalid_client', 'client_secret 不正确或未提供')
  }

  const row = await takeRefreshTokenForRotation(refreshToken)
  if (!row || row.clientId !== client.clientId) {
    return jsonError(400, 'invalid_grant', 'refresh_token 无效或已吊销')
  }

  const bundle = await issueAccessAndId(client, row.userId, row.scope, null)
  if (!bundle) return jsonError(400, 'invalid_grant', '用户不可用')

  const newRefresh = newRefreshTokenPlain()
  const days = clampRefreshTokenTtlDays(client)
  await insertRefreshTokenRow({
    plainToken: newRefresh,
    clientId: client.clientId,
    userId: row.userId,
    scope: row.scope,
    expiresAtIso: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
  })

  return NextResponse.json(
    {
      access_token: bundle.accessToken,
      token_type: 'Bearer',
      expires_in: bundle.expiresIn,
      scope: bundle.scope,
      refresh_token: newRefresh,
      ...(bundle.idToken ? { id_token: bundle.idToken } : {}),
    },
    { headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' } }
  )
}

/**
 * OAuth2 令牌端点（授权码换 token、refresh_token）。
 * @see RFC 6749 §4.1.3、§6、OpenID Connect Core
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
  if (grantType === 'authorization_code') {
    return handleAuthorizationCode(req, body)
  }
  if (grantType === 'refresh_token') {
    return handleRefreshToken(req, body)
  }
  return jsonError(400, 'unsupported_grant_type')
}
