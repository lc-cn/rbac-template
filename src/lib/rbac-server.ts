import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { userHasPermission } from '@/lib/data-access'
import { enforceTenantRbac } from '@/lib/rbac-env'
import { tenantLifecycleBlocksMutations } from '@/lib/tenant-lifecycle'
import type { AppSession } from '@/types/session'

export { enforceTenantRbac } from '@/lib/rbac-env'

function isMutatingHttpMethod(method: string | undefined): boolean {
  const m = method ?? 'GET'
  return m === 'POST' || m === 'PUT' || m === 'PATCH' || m === 'DELETE'
}

/**
 * 缺少业务 permission 时返回 403，错误体 `{ error: 'forbidden_permission' }`（与治理码区分）。
 * `request`：传入时在变更类方法上额外校验租户暂停/归档（只读模式，Issue #6）。
 */
export async function guardTenantRbac(
  session: AppSession | null,
  tenantId: string,
  permissionCode: string,
  request?: Pick<NextRequest, 'method'>
): Promise<NextResponse | null> {
  const uid = session?.user?.id
  if (uid && isMutatingHttpMethod(request?.method) && (await tenantLifecycleBlocksMutations(tenantId))) {
    return NextResponse.json({ error: 'forbidden_tenant_read_only' }, { status: 403 })
  }
  if (!enforceTenantRbac()) return null
  if (!uid) return NextResponse.json({ error: '未登录' }, { status: 401 })
  const ok = await userHasPermission(uid, tenantId, permissionCode)
  if (!ok) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[rbac] denied user=${uid} tenant=${tenantId} permission=${permissionCode}`
      )
    }
    return NextResponse.json({ error: 'forbidden_permission' }, { status: 403 })
  }
  return null
}
