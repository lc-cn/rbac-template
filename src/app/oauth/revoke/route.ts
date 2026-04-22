import { NextRequest, NextResponse } from 'next/server'
import { getOAuth2ClientByClientId, isPublicClient, revokeRefreshTokenByPlain, verifyClientSecret } from '@/lib/oauth2/store'

function parseBasicAuth(header: string | null): { id: string; secret: string } | null {
  if (!header?.startsWith('Basic ')) return null
  const decoded = Buffer.from(header.slice(6).trim(), 'base64').toString('utf8')
  const idx = decoded.indexOf(':')
  if (idx < 0) return null
  return { id: decoded.slice(0, idx), secret: decoded.slice(idx + 1) }
}

/**
 * OAuth2 令牌吊销（RFC 7009）。当前实现：吊销数据库中的 refresh_token。
 */
export async function POST(req: NextRequest) {
  let body: URLSearchParams
  try {
    body = new URLSearchParams(await req.text())
  } catch {
    return new NextResponse(null, { status: 400 })
  }

  const token = body.get('token')
  const tokenTypeHint = body.get('token_type_hint')
  let clientId = body.get('client_id')
  let clientSecret = body.get('client_secret')
  const basic = parseBasicAuth(req.headers.get('authorization'))
  if (basic) {
    clientId = clientId || basic.id
    clientSecret = clientSecret || basic.secret
  }

  if (!token) {
    return new NextResponse(null, { status: 400 })
  }

  if (clientId) {
    const client = await getOAuth2ClientByClientId(clientId)
    if (!client) return new NextResponse(null, { status: 401 })
    if (!isPublicClient(client)) {
      if (!verifyClientSecret(client, clientSecret)) {
        return new NextResponse(null, { status: 401 })
      }
    }
  }

  if (tokenTypeHint === 'access_token') {
    // 无状态 JWT：本模板不维护 access 吊销列表，仍返回 200（RFC 允许）
    return new NextResponse(null, { status: 200, headers: { 'Cache-Control': 'no-store' } })
  }

  await revokeRefreshTokenByPlain(token)
  return new NextResponse(null, { status: 200, headers: { 'Cache-Control': 'no-store' } })
}
