/** Issuer（iss）与对外元数据使用的根 URL，无末尾斜杠 */
export function getOAuthIssuer(): string {
  const raw = (process.env.OAUTH_ISSUER_URL || process.env.NEXTAUTH_URL || '').trim().replace(/\/+$/, '')
  if (!raw) {
    throw new Error('请配置 OAUTH_ISSUER_URL 或 NEXTAUTH_URL 作为 OAuth2/OIDC 的 issuer 根地址')
  }
  return raw
}
