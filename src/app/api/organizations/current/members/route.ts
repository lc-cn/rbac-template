import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { listTenantMembersForCurrentOrganizationPage } from '@/lib/data-access'
import { parseOrganizationsCurrentMembersPageQuery } from '@/lib/organizations-current-members-params'
import { requireUserId } from '@/lib/tenant-server'

export const dynamic = 'force-dynamic'

/** Issue #16：当前会话租户成员目录（分页 + 搜索）；校验 `UserTenant` 与 `currentTenantId`。 */
export async function GET(request: NextRequest) {
  const session = await auth()
  const uid = requireUserId(session)
  if (uid instanceof Response) return uid
  const tid = session?.currentTenantId ?? null
  if (!tid) {
    return NextResponse.json({ error: 'no_tenant_context' }, { status: 403 })
  }
  const { page, q } = parseOrganizationsCurrentMembersPageQuery(new URL(request.url).searchParams)
  const result = await listTenantMembersForCurrentOrganizationPage(uid, tid, { page, search: q })
  if (!result) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  return NextResponse.json(result)
}
