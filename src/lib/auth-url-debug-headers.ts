/**
 * 开发环境：在 Auth 路由响应上附加当前进程解析到的 URL 相关变量，便于在浏览器 Network 里排查
 * 「本地却跳到生产域名」等问题（不含任何密钥）。
 */
export function attachAuthUrlDebugHeaders(res: Response): Response {
  if (process.env.NODE_ENV !== 'development') return res

  const authUrl = process.env.AUTH_URL?.trim() ?? ''
  const nextAuthUrl = process.env.NEXTAUTH_URL?.trim() ?? ''
  const effective = authUrl || nextAuthUrl

  const headers = new Headers(res.headers)
  headers.set('X-Debug-Auth-Effective', effective || '(none)')
  headers.set('X-Debug-Auth-AUTH_URL', authUrl || '(unset)')
  headers.set('X-Debug-Auth-NEXTAUTH_URL', nextAuthUrl || '(unset)')
  headers.set(
    'X-Debug-Auth-Note',
    'NextAuth uses AUTH_URL first, then NEXTAUTH_URL; see next-auth/lib/env.js reqWithEnvURL'
  )

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  })
}
