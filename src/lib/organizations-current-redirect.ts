/**
 * Issue #15：`/organizations/current` 在会话无 `currentTenantId` 时的重定向目标
 *（与全局 `proxy` 中「无租户 → 平台区」策略区分：本页平台管理员回首页）。
 */
export function redirectPathWhenMissingCurrentTenant(isPlatformAdmin: boolean): '/no-tenant' | '/' {
  return isPlatformAdmin ? '/' : '/no-tenant'
}
