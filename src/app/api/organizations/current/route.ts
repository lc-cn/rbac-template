import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getTenantCurrentSummaryForMember } from '@/lib/data-access'
import { requireUserId } from '@/lib/tenant-server'

export const dynamic = 'force-dynamic'

/** Issue #15：只读返回当前会话租户摘要；校验 `UserTenant` 成员关系。 */
export async function GET() {
  const session = await auth()
  const uid = requireUserId(session)
  if (uid instanceof Response) return uid
  const tid = session?.currentTenantId ?? null
  if (!tid) {
    return NextResponse.json({ error: 'no_tenant_context' }, { status: 403 })
  }
  const summary = await getTenantCurrentSummaryForMember(uid, tid)
  if (!summary) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  return NextResponse.json({ tenant: summary })
}
