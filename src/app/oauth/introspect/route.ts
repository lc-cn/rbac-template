import { NextRequest, NextResponse } from 'next/server'
import {
  getOAuth2ClientByClientId,
  getUserClaimsForToken,
  isPublicClient,
  lookupRefreshTokenActive,
  verifyClientSecret,
} from '@/lib/oauth2/store'
import { verifyAccessToken } from '@/lib/oauth2/jwt-as'

function parseBasicAuth(header: string | null): { id: string; secret: string } | null {
  if (!header?.startsWith('Basic ')) return null
  const decoded = Buffer.from(header.slice(6).trim(), 'base64').toString('utf8')
  const idx = decoded.indexOf(':')
  if (idx < 0) return null
  return { id: decoded.slice(0, idx), secret: decoded.slice(idx + 1) }
}

/**
 * OAuth2 令牌自省（RFC 7662）。
 */
export async function POST(req: NextRequest) {
  let body: URLSearchParams
  try {
    body = new URLSearchParams(await req.text())
  } catch {
    return NextResponse.json({ active: false }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
  }

  let clientId = body.get('client_id')
  let clientSecret = body.get('client_secret')
  const basic = parseBasicAuth(req.headers.get('authorization'))
  if (basic) {
    clientId = clientId || basic.id
    clientSecret = clientSecret || basic.secret
  }

  if (!clientId) {
    return NextResponse.json({ error: 'invalid_client' }, { status: 401 })
  }

  const client = await getOAuth2ClientByClientId(clientId)
  if (!client) return NextResponse.json({ error: 'invalid_client' }, { status: 401 })
  if (!isPublicClient(client)) {
    if (!verifyClientSecret(client, clientSecret)) {
      return NextResponse.json({ error: 'invalid_client' }, { status: 401 })
    }
  }

  const token = body.get('token')
  if (!token) {
    return NextResponse.json({ active: false }, { headers: { 'Cache-Control': 'no-store' } })
  }

  if (token.includes('.') && token.split('.').length === 3) {
    try {
      const payload = await verifyAccessToken(token)
      const sub = typeof payload.sub === 'string' ? payload.sub : undefined
      const scope = typeof payload.scope === 'string' ? payload.scope : undefined
      const aud = typeof payload.aud === 'string' ? payload.aud : Array.isArray(payload.aud) ? String(payload.aud[0]) : undefined
      if (aud && aud !== client.clientId) {
        return NextResponse.json({ active: false }, { headers: { 'Cache-Control': 'no-store' } })
      }
      const exp = typeof payload.exp === 'number' ? payload.exp : undefined
      const iat = typeof payload.iat === 'number' ? payload.iat : undefined
      const out: Record<string, unknown> = {
        active: true,
        token_type: 'Bearer',
        scope,
        client_id: client.clientId,
        sub,
        exp,
        iat,
      }
      if (sub) {
        const claims = await getUserClaimsForToken(sub)
        if (claims) {
          if (scope && /\bemail\b/.test(scope) && claims.email) out.email = claims.email
          if (scope && /\bprofile\b/.test(scope) && claims.name) out.name = claims.name
        }
      }
      return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } })
    } catch {
      return NextResponse.json({ active: false }, { headers: { 'Cache-Control': 'no-store' } })
    }
  }

  const row = await lookupRefreshTokenActive(token)
  if (!row || row.clientId !== client.clientId) {
    return NextResponse.json({ active: false }, { headers: { 'Cache-Control': 'no-store' } })
  }
  const expMs = Date.parse(row.expiresAt)
  const expSec = Number.isFinite(expMs) ? Math.floor(expMs / 1000) : undefined
  return NextResponse.json(
    {
      active: true,
      token_type: 'refresh_token',
      scope: row.scope,
      client_id: row.clientId,
      sub: row.userId,
      ...(expSec != null ? { exp: expSec } : {}),
    },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
