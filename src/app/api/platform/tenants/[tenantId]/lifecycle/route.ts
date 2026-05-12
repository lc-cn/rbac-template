import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { setTenantLifecycleFields } from '@/lib/data-access'
import { forbidPlatformTenantUnarchive, parseTenantLifecyclePatchBody } from '@/lib/tenant-lifecycle-patch'
import { requirePlatformAdmin } from '@/lib/tenant-server'

/** 平台管理员：跨租户写入生命周期（Issue #18）。body 与 owner 路由一致；不支持解除归档。 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ tenantId: string }> }) {
  try {
    const { tenantId } = await params
    const session = await auth()
    const denied = requirePlatformAdmin(session)
    if (denied) return denied

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: '请求体无效' }, { status: 400 })
    }

    const parsed = parseTenantLifecyclePatchBody(body)
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status })

    const allowed = forbidPlatformTenantUnarchive(parsed.patch)
    if (!allowed.ok) return NextResponse.json({ error: allowed.error }, { status: allowed.status })

    const ok = await setTenantLifecycleFields(tenantId, allowed.patch)
    if (ok === null) return NextResponse.json({ error: '租户不存在' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'patch_failed' }, { status: 500 })
  }
}
