import { NextResponse } from 'next/server'
import { getOAuthJwks } from '@/lib/oauth2/jwt-as'

/** JWKS（配置 OAUTH_RSA_PRIVATE_KEY_* 时返回非空 keys） */
export async function GET() {
  try {
    const jwks = await getOAuthJwks()
    return NextResponse.json(jwks, { headers: { 'Cache-Control': 'public, max-age=3600' } })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'jwks 生成失败'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
