import { NextRequest, NextResponse } from 'next/server'
import { createOAuth2ClientAdmin, listOAuth2ClientsAdmin } from '@/lib/oauth2/client-admin'

export async function GET() {
  try {
    const list = await listOAuth2ClientsAdmin()
    return NextResponse.json(list)
  } catch {
    return NextResponse.json({ error: '获取 OAuth2 客户端列表失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, clientId, redirectUris, allowedScopes, confidential, clientSecret } = body
    const { dto, plainSecret } = await createOAuth2ClientAdmin({
      name,
      clientId,
      redirectUris,
      allowedScopes,
      confidential: Boolean(confidential),
      plainSecret: clientSecret ?? null,
    })
    return NextResponse.json(
      { ...dto, ...(plainSecret ? { clientSecret: plainSecret } : {}) },
      { status: 201 }
    )
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '创建失败'
    if (msg.includes('必填') || msg.includes('至少') || msg.includes('client_id')) {
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    return NextResponse.json({ error: '创建 OAuth2 客户端失败' }, { status: 500 })
  }
}
