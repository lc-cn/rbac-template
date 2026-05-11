import { NextResponse } from 'next/server'
import { userHasPermission } from '@/lib/data-access'
import { enforceTenantRbac } from '@/lib/rbac-env'
import type { AppSession } from '@/types/session'

export { enforceTenantRbac } from '@/lib/rbac-env'

/**
 * 缺少业务 permission 时返回 403，错误体 `{ error: 'forbidden_permission' }`（与治理码区分）。
 */
export async function guardTenantRbac(
  session: AppSession | null,
  tenantId: string,
  permissionCode: string
): Promise<NextResponse | null> {
  if (!enforceTenantRbac()) return null
  const uid = session?.user?.id
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
