import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { consumeInvitationByPlainToken } from '@/lib/data-access'

/**
 * 接受租户邀请（需在登录态下调用；无需当前租户上下文）。
 * POST body: `{ "token": "<plain invitation token>" }`
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const uid = session?.user?.id
    const email = session?.user?.email
    if (!uid || !email) {
      return NextResponse.json({ error: '未登录或会话缺少邮箱' }, { status: 401 })
    }
    const body = (await request.json()) as { token?: unknown }
    const token = typeof body.token === 'string' ? body.token.trim() : ''
    if (!token) return NextResponse.json({ error: '缺少 token' }, { status: 400 })

    const result = await consumeInvitationByPlainToken(token, uid, email)
    if (!result.ok) {
      const status =
        result.code === 'invalid_token' || result.code === 'expired' || result.code === 'consumed'
          ? 400
          : result.code === 'email_mismatch'
            ? 403
            : result.code === 'tenant_locked'
              ? 403
              : result.code === 'already_member'
                ? 409
                : 400
      return NextResponse.json({ error: result.code }, { status })
    }
    return NextResponse.json({ tenantId: result.tenantId })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'accept_failed' }, { status: 500 })
  }
}
