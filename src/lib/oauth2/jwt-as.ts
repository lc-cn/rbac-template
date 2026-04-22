import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { getOAuthIssuer } from '@/lib/oauth2/issuer'

function secretKey(): Uint8Array {
  const raw = (process.env.OAUTH_JWT_SECRET || process.env.NEXTAUTH_SECRET || '').trim()
  if (raw.length < 32) {
    throw new Error('OAUTH_JWT_SECRET 或 NEXTAUTH_SECRET 须至少 32 字符，用于签发 OAuth2 access_token / id_token')
  }
  return new TextEncoder().encode(raw)
}

export async function signAccessToken(params: {
  sub: string
  aud: string
  scope: string
}): Promise<string> {
  const issuer = getOAuthIssuer()
  return new SignJWT({ scope: params.scope, token_use: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(issuer)
    .setSubject(params.sub)
    .setAudience(params.aud)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secretKey())
}

export async function signIdToken(params: {
  sub: string
  aud: string
  nonce?: string | null
  email?: string
  name?: string
  picture?: string
}): Promise<string> {
  const issuer = getOAuthIssuer()
  const body: Record<string, unknown> = {}
  if (params.email != null) body.email = params.email
  if (params.name != null) body.name = params.name
  if (params.picture != null) body.picture = params.picture
  if (params.nonce) body.nonce = params.nonce

  return new SignJWT(body)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(issuer)
    .setSubject(params.sub)
    .setAudience(params.aud)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secretKey())
}

export async function verifyAccessToken(token: string): Promise<JWTPayload> {
  const issuer = getOAuthIssuer()
  const { payload } = await jwtVerify(token, secretKey(), {
    issuer,
    algorithms: ['HS256'],
  })
  if (payload.token_use !== 'access') throw new Error('invalid token type')
  return payload
}
