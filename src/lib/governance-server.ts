import { NextResponse } from 'next/server'
import type { AppSession } from '@/types/session'
import { getUserTenantMembership } from '@/lib/data-access'
import type { TenantRole } from '@/lib/data-access'
import type { GovernanceErrorCode } from '@/lib/governance-policy'

/** 403 JSON：`error` 为稳定机器可读码（Issue #4） */
export function governanceForbiddenResponse(code: GovernanceErrorCode): NextResponse {
  return NextResponse.json({ error: code }, { status: 403 })
}

/**
 * 租户写接口：以数据库 UserTenant 为准解析 actor 的 tenantRole。
 * 平台管理员若无成员关系则无特权（E1）。
 */
export async function requireActorTenantRole(
  session: AppSession | null,
  tenantId: string
): Promise<{ userId: string; tenantRole: TenantRole } | NextResponse> {
  const uid = session?.user?.id
  if (!uid) return NextResponse.json({ error: '未登录' }, { status: 401 })
  const m = await getUserTenantMembership(uid, tenantId)
  if (!m) {
    return governanceForbiddenResponse('forbidden_not_tenant_member')
  }
  return { userId: uid, tenantRole: m.tenantRole }
}
