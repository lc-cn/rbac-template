import type { AppSession } from '@/types/session'

export function requireUserId(session: AppSession | null): string | Response {
  const id = session?.user?.id
  if (!id) return Response.json({ error: '未登录' }, { status: 401 })
  if (session.mfaPending) {
    return Response.json({ error: '需要完成多因素验证' }, { status: 403 })
  }
  return id
}

/** 业务读写 API：必须有当前租户上下文 */
export function requireTenantId(session: AppSession | null): string | Response {
  const uid = requireUserId(session)
  if (uid instanceof Response) return uid
  const tid = session?.currentTenantId ?? null
  if (!tid) return Response.json({ error: '请先选择租户后再执行此操作' }, { status: 403 })
  return tid
}

/** 平台跨租户 API（列表、生命周期 PATCH 等） */
export function requirePlatformAdmin(session: AppSession | null): Response | null {
  const uid = requireUserId(session)
  if (uid instanceof Response) return uid
  if (!session?.isPlatformAdmin) return Response.json({ error: '需要平台管理员权限' }, { status: 403 })
  return null
}
