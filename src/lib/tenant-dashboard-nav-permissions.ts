import { PermissionCodes as P, type PermissionCode } from './permission-codes.ts'
import { enforceTenantRbac } from './rbac-env.ts'

type SessionLike = {
  currentTenantId?: string | null
  tenantPermissionCodes?: string[] | null
  isPlatformAdmin?: boolean
} | null | undefined

/** 控制台侧栏项：与租户内 GET API 所需的 read permission 对齐（见 `tenant-route-permissions.ts`）。 */
export const SIDEBAR_NAV_ACCESS = [
  { href: '/', labelKey: 'nav.dashboard' as const, requiredRead: null as null, showWithoutTenant: true },
  {
    href: '/organizations/current',
    labelKey: 'nav.currentOrganization' as const,
    requiredRead: null,
    showWithoutTenant: false,
  },
  { href: '/profile', labelKey: 'nav.profile' as const, requiredRead: null, showWithoutTenant: true },
  { href: '/users', labelKey: 'nav.users' as const, requiredRead: P.USER_READ, showWithoutTenant: false },
  { href: '/roles', labelKey: 'nav.roles' as const, requiredRead: P.ROLE_READ, showWithoutTenant: false },
  { href: '/permissions', labelKey: 'nav.permissions' as const, requiredRead: P.PERM_READ, showWithoutTenant: false },
  { href: '/applications', labelKey: 'nav.applications' as const, requiredRead: P.APPLICATION_READ, showWithoutTenant: false },
  { href: '/features', labelKey: 'nav.features' as const, requiredRead: P.FEATURE_READ, showWithoutTenant: false },
  { href: '/system-config', labelKey: 'nav.systemConfig' as const, requiredRead: P.SYSTEM_CONFIG_READ, showWithoutTenant: false },
] as const

export type SidebarNavAccessRow = (typeof SIDEBAR_NAV_ACCESS)[number]

/** 侧栏/入口是否展示该租户内链接（平台区由 `isPlatformAdmin` 单独控制）。 */
export function sidebarTenantLinkVisible(
  row: Pick<SidebarNavAccessRow, 'requiredRead' | 'showWithoutTenant'>,
  session: SessionLike
): boolean {
  if (!enforceTenantRbac()) return true
  const tid = session?.currentTenantId
  if (row.requiredRead == null) {
    if (row.showWithoutTenant) return true
    return !!tid
  }
  if (!tid) return false
  const codes = session?.tenantPermissionCodes
  if (codes == null) return false
  return codes.includes(row.requiredRead)
}

/** 深链/布局守卫：当前会话是否具备指定 read permission。 */
export function sessionHasTenantRead(session: SessionLike, permission: PermissionCode): boolean {
  if (!enforceTenantRbac()) return true
  const tid = session?.currentTenantId
  if (!tid) return false
  const codes = session?.tenantPermissionCodes
  if (codes == null) return false
  return codes.includes(permission)
}
