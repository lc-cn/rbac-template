import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthCsrf } from '@/lib/auth-csrf'
import { sessionCookieSecure } from '@/lib/auth-cookie'
import {
  consumeMfaRecoveryToken,
  hashRecoveryToken,
  insertSecurityAudit,
  nuclearMfaRecoveryForUser,
} from '@/lib/security-data-access'
import { clearSessionCookieOnResponse } from '@/lib/session-cookie-set'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { csrfToken?: unknown; token?: unknown }
    const csrf = typeof body.csrfToken === 'string' ? body.csrfToken : ''
    const token = typeof body.token === 'string' ? body.token : ''
    if (!token || !verifyAuthCsrf(req.headers.get('cookie'), csrf)) {
      return NextResponse.json({ error: '请求无效' }, { status: 400 })
    }

    const hash = hashRecoveryToken(token)
    const userId = await consumeMfaRecoveryToken(hash)
    if (!userId) {
      return NextResponse.json({ error: '链接无效或已使用' }, { status: 400 })
    }

    await nuclearMfaRecoveryForUser(userId)
    await insertSecurityAudit(userId, 'recovery_used', null)

    const secure = sessionCookieSecure(req)
    const res = NextResponse.json({
      ok: true,
      warnChangePassword: true,
      message: '已重置 MFA 与全部 Passkey，并终止所有会话。请尽快修改密码。',
    })
    clearSessionCookieOnResponse(res, secure)
    return res
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '处理失败' }, { status: 500 })
  }
}
