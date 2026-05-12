import type { AppSession } from '../types/session.ts'

export type PlatformAdminApiGate =
  | { ok: true }
  | { ok: false; status: 401 | 403; error: string }

/** 供 `requirePlatformAdmin` 与单测复用；不依赖 Next.js。 */
export function checkPlatformAdminApiAccess(session: AppSession | null): PlatformAdminApiGate {
  const id = session?.user?.id
  if (!id) return { ok: false, status: 401, error: '未登录' }
  if (session.mfaPending) {
    return { ok: false, status: 403, error: '需要完成多因素验证' }
  }
  if (!session.isPlatformAdmin) {
    return { ok: false, status: 403, error: '需要平台管理员权限' }
  }
  return { ok: true }
}
