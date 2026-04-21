/**
 * 生产环境务必设置 NEXTAUTH_SECRET（或 AUTH_SECRET）。
 * 未设置时使用固定回退值，仅便于本地开箱运行；公网部署请勿依赖回退值。
 */
export function getAuthSecret(): string {
  return (
    process.env.NEXTAUTH_SECRET ??
    process.env.AUTH_SECRET ??
    'rbac-template-dev-auth-secret-fallback'
  )
}
