import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { setTenantLifecycleFields } from '@/lib/data-access'
import { governanceForbiddenResponse, requireActorTenantRole } from '@/lib/governance-server'
import { requireTenantId } from '@/lib/tenant-server'

/** owner：切换租户暂停 / 归档（Issue #6 第三波）。PATCH body: `{ "suspended"?: boolean, "archived"?: boolean }` */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ tenantId: string }> }) {
  try {
    const { tenantId } = await params
    const session = await auth()
    const tenantRes = requireTenantId(session)
    if (tenantRes instanceof NextResponse) return tenantRes
    if (tenantRes !== tenantId) return NextResponse.json({ error: '租户上下文不一致' }, { status: 403 })

    const actor = await requireActorTenantRole(session, tenantId)
    if (actor instanceof NextResponse) return actor
    if (actor.tenantRole !== 'owner') return governanceForbiddenResponse('forbidden_owner_only')

    const body = (await request.json()) as { suspended?: unknown; archived?: unknown }
    const patch: { suspended?: boolean; archived?: boolean } = {}
    if (typeof body.suspended === 'boolean') patch.suspended = body.suspended
    if (typeof body.archived === 'boolean') patch.archived = body.archived
    if (patch.suspended === undefined && patch.archived === undefined) {
      return NextResponse.json({ error: '缺少 suspended 或 archived' }, { status: 400 })
    }

    const ok = await setTenantLifecycleFields(tenantId, patch)
    if (ok === null) return NextResponse.json({ error: '租户不存在' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'patch_failed' }, { status: 500 })
  }
}
