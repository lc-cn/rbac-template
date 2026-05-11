/**
 * `ENFORCE_RBAC_ON_WRITE` 解析：无 Next.js / 框架依赖，便于单测。
 */
export function enforceTenantRbac(): boolean {
  const v = process.env.ENFORCE_RBAC_ON_WRITE?.trim().toLowerCase() ?? 'true'
  if (v === '0' || v === 'false' || v === 'no' || v === 'off') return false
  return true
}
