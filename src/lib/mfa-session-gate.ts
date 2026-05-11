import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function requireMfaPendingSession(): Promise<
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse }
> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, response: NextResponse.json({ error: '未登录' }, { status: 401 }) }
  }
  if (!session.mfaPending) {
    return { ok: false, response: NextResponse.json({ error: '当前不需要 MFA 验证' }, { status: 403 }) }
  }
  return { ok: true, userId: session.user.id }
}
