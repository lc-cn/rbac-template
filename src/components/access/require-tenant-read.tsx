import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { auth } from '@/auth'
import type { PermissionCode } from '@/lib/permission-codes'
import { sessionHasTenantRead } from '@/lib/tenant-dashboard-nav-permissions'
import { TenantReadDeniedPanel } from '@/components/access/tenant-read-denied-panel'

type Props = { permission: PermissionCode; children: ReactNode }

/** 租户内页面布局守卫：无读权限时渲染一致拒绝态，不替代 API 403。 */
export async function RequireTenantRead({ permission, children }: Props) {
  const session = await auth()
  if (sessionHasTenantRead(session, permission)) {
    return <>{children}</>
  }
  if (!session?.currentTenantId) {
    redirect('/no-tenant')
  }
  return <TenantReadDeniedPanel permissionCode={permission} />
}
