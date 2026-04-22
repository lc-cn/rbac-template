import { NextRequest, NextResponse } from 'next/server'
import { deleteOAuth2ClientAdmin, getOAuth2ClientAdminById, updateOAuth2ClientAdmin } from '@/lib/oauth2/client-admin'

type RouteCtx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params
  try {
    const row = await getOAuth2ClientAdminById(id)
    if (!row) return NextResponse.json({ error: '不存在' }, { status: 404 })
    return NextResponse.json(row)
  } catch {
    return NextResponse.json({ error: '读取失败' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params
  try {
    const body = await request.json()
    const { name, redirectUris, allowedScopes, confidential, clientSecret, regenerateSecret } = body
    const { dto, plainSecret } = await updateOAuth2ClientAdmin(id, {
      name,
      redirectUris,
      allowedScopes,
      confidential: confidential === undefined ? undefined : Boolean(confidential),
      plainSecret: clientSecret ?? null,
      regenerateSecret: Boolean(regenerateSecret),
    })
    return NextResponse.json({ ...dto, ...(plainSecret ? { clientSecret: plainSecret } : {}) })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '更新失败'
    if (msg === '客户端不存在') return NextResponse.json({ error: msg }, { status: 404 })
    if (msg.includes('必填') || msg.includes('至少')) return NextResponse.json({ error: msg }, { status: 400 })
    return NextResponse.json({ error: '更新 OAuth2 客户端失败' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params
  try {
    const ok = await deleteOAuth2ClientAdmin(id)
    if (!ok) return NextResponse.json({ error: '不存在' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
