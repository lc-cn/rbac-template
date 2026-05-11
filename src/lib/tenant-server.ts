import { NextResponse } from 'next/server'
import type { AppSession } from '@/types/session'

export function requireUserId(session: AppSession | null): string | NextResponse {
  const id = session?.user?.id
  if (!id) return NextResponse.json({ error: '未登录' }, { status: 401 })
  return id
}

/** 业务读写 API：必须有当前租户上下文 */
export function requireTenantId(session: AppSession | null): string | NextResponse {
  const uid = requireUserId(session)
  if (uid instanceof NextResponse) return uid
  const tid = session?.currentTenantId ?? null
  if (!tid) return NextResponse.json({ error: '请先选择租户后再执行此操作' }, { status: 403 })
  return tid
}

/** 平台只读总览 */
export function requirePlatformAdmin(session: AppSession | null): NextResponse | null {
  const uid = requireUserId(session)
  if (uid instanceof NextResponse) return uid
  if (!session?.isPlatformAdmin) return NextResponse.json({ error: '需要平台管理员权限' }, { status: 403 })
  return null
}
