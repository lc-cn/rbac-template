import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { confirmOwnerTransferRequest } from '@/lib/data-access'
import { requireTenantId } from '@/lib/tenant-server'
import { featureOwnerTransferEnabled } from '@/lib/wave3-env'

/** 受邀用户（目标成员）确认接手 owner */
export async function POST(request: NextRequest, { params }: { params: Promise<{ tenantId: string }> }) {
  try {
    if (!featureOwnerTransferEnabled()) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    const { tenantId } = await params
    const session = await auth()
    const uid = session?.user?.id
    if (!uid) return NextResponse.json({ error: '未登录' }, { status: 401 })
    const tenantRes = requireTenantId(session)
    if (tenantRes instanceof Response) return tenantRes
    if (tenantRes !== tenantId) {
      return NextResponse.json({ error: '请先切换到目标租户后再确认移交' }, { status: 403 })
    }

    const body = (await request.json()) as { requestId?: unknown }
    const requestId = typeof body.requestId === 'string' ? body.requestId.trim() : ''
    if (!requestId) return NextResponse.json({ error: '缺少 requestId' }, { status: 400 })

    const result = await confirmOwnerTransferRequest(requestId, tenantId, uid)
    if (result === 'not_found') return NextResponse.json({ error: '请求不存在' }, { status: 404 })
    if (result === 'not_pending') return NextResponse.json({ error: '请求已处理' }, { status: 400 })
    if (result === 'wrong_user') return NextResponse.json({ error: '只有受邀用户可确认' }, { status: 403 })
    if (result === 'expired') return NextResponse.json({ error: '请求已过期' }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'confirm_failed' }, { status: 500 })
  }
}
