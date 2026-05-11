/**
 * 租户策略（环境变量）。与 PRD「混合交付」一致：同一代码通过配置控制是否允许自助建租户等。
 */
export function allowSelfServiceTenantCreate(): boolean {
  const v = process.env.ALLOW_SELF_SERVICE_TENANT_CREATE?.trim().toLowerCase() ?? ''
  if (v === '0' || v === 'false' || v === 'no' || v === 'off') return false
  return true
}
