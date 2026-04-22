import { NextResponse } from 'next/server'
import { getOAuthIssuer } from '@/lib/oauth2/issuer'

/** OpenID Provider 元数据（自建 IdP） */
export async function GET() {
  let issuer: string
  try {
    issuer = getOAuthIssuer()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'issuer 未配置'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  const meta = {
    issuer,
    authorization_endpoint: `${issuer}/oauth/authorize`,
    token_endpoint: `${issuer}/oauth/token`,
    userinfo_endpoint: `${issuer}/oauth/userinfo`,
    response_types_supported: ['code'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['HS256'],
    scopes_supported: ['openid', 'profile', 'email'],
    token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
    grant_types_supported: ['authorization_code'],
    claims_supported: ['sub', 'iss', 'aud', 'exp', 'iat', 'email', 'name', 'picture', 'nonce'],
  }

  return NextResponse.json(meta, { headers: { 'Cache-Control': 'public, max-age=3600' } })
}
