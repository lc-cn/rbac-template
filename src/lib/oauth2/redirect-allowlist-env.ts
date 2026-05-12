/** 解析环境变量中的多行 / 逗号分隔 URI 列表（去重前逐项 trim）。 */
export function parseEnvRedirectUriList(raw: string | undefined | null): string[] {
  if (raw == null) return []
  const s = String(raw).trim()
  if (!s) return []
  return s
    .split(/[\n,]+/)
    .map((x) => x.trim())
    .filter(Boolean)
}

/**
 * 授权端点 redirect_uri 白名单：数据库登记项 + 进程环境变量（按部署区分，不必改共享库）。
 * @see OIDC_EXTRA_REDIRECT_URIS
 */
export function oauthAuthorizeRedirectUriAllowlist(storedUris: string[]): string[] {
  const extra = parseEnvRedirectUriList(process.env.OIDC_EXTRA_REDIRECT_URIS)
  return [...new Set([...storedUris, ...extra])]
}

/**
 * RP 登出 post_logout_redirect_uri 白名单：数据库 + 环境变量扩展。
 * @see OIDC_EXTRA_POST_LOGOUT_REDIRECT_URIS
 */
export function oauthPostLogoutRedirectUriAllowlist(storedUris: string[]): string[] {
  const extra = parseEnvRedirectUriList(process.env.OIDC_EXTRA_POST_LOGOUT_REDIRECT_URIS)
  return [...new Set([...storedUris, ...extra])]
}
