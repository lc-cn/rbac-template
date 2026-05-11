import { NextResponse } from 'next/server'
import type { Session } from 'next-auth'
import { auth } from '@/auth'

/** 控制台业务 API：须已登录且非半登录（MFA 已完成） */
export async function requireBusinessSession(): Promise<
  | { ok: true; userId: string; session: Session }
  | { ok: false; response: NextResponse }
> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, response: NextResponse.json({ error: '未登录' }, { status: 401 }) }
  }
  if (session.mfaPending) {
    return { ok: false, response: NextResponse.json({ error: '需要完成多因素验证' }, { status: 403 }) }
  }
  return { ok: true, userId: session.user.id, session }
}
