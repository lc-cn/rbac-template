/** 公开文档区顶部导航（顺序即推荐阅读顺序） */
export const docsNavItems = [
  { href: '/docs', label: '概览' },
  { href: '/docs/overview', label: '产品概述' },
  { href: '/docs/tenants', label: '多租户' },
  { href: '/docs/rbac', label: '权限与治理' },
  { href: '/docs/console', label: '管理控制台' },
  { href: '/docs/system-platform', label: '系统与平台' },
  { href: '/docs/security', label: '身份与安全' },
  { href: '/docs/oauth2', label: 'OIDC 接入' },
] as const

export function isDocsNavActive(pathname: string, href: string): boolean {
  if (href === '/docs') return pathname === '/docs'
  return pathname === href || pathname.startsWith(`${href}/`)
}
