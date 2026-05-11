import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthCsrf } from '@/lib/auth-csrf'
import { requireBusinessSession } from '@/lib/console-auth'
import { deleteWebAuthnCredential, updateWebAuthnCredentialFlags } from '@/lib/security-data-access'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const gate = await requireBusinessSession()
    if (!gate.ok) return gate.response
    const { id } = await params

    const body = (await req.json()) as {
      csrfToken?: unknown
      canLogin?: unknown
      canMfa?: unknown
      label?: unknown
    }
    const csrf = typeof body.csrfToken === 'string' ? body.csrfToken : ''
    if (!verifyAuthCsrf(req.headers.get('cookie'), csrf)) {
      return NextResponse.json({ error: '请求无效' }, { status: 400 })
    }

    const patch: { canLogin?: boolean; canMfa?: boolean; label?: string | null } = {}
    if (body.canLogin !== undefined) patch.canLogin = body.canLogin === true
    if (body.canMfa !== undefined) patch.canMfa = body.canMfa === true
    if (body.label !== undefined) patch.label = typeof body.label === 'string' ? body.label.trim().slice(0, 80) : null

    const ok = await updateWebAuthnCredentialFlags(id, gate.userId, patch)
    if (!ok) return NextResponse.json({ error: '未找到凭据' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const gate = await requireBusinessSession()
    if (!gate.ok) return gate.response
    const { id } = await params

    const body = (await req.json().catch(() => ({}))) as { csrfToken?: unknown }
    const csrf = typeof body.csrfToken === 'string' ? body.csrfToken : ''
    if (!verifyAuthCsrf(req.headers.get('cookie'), csrf)) {
      return NextResponse.json({ error: '请求无效' }, { status: 400 })
    }

    const ok = await deleteWebAuthnCredential(id, gate.userId)
    if (!ok) return NextResponse.json({ error: '未找到凭据' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
