import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { verifyAuthCsrf } from '@/lib/auth-csrf'
import { findUserByEmail, getUserByIdGlobal } from '@/lib/data-access'
import { getAppBaseUrl } from '@/lib/webauthn-rp'
import { verifyStoredPassword } from '@/lib/password'
import { getUserMfaRow, hashRecoveryToken, insertMfaRecoveryToken, newRecoveryPlainToken } from '@/lib/security-data-access'

function logRecovery(email: string, link: string) {
  if (process.env.MFA_RECOVERY_LOG_ONLY === '0') return
  console.info('[mfa-recovery]', email, link)
}

/**
 * 半登录态或邮箱密码：请求 MFA 核选项邮件（1 小时有效令牌）。
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      csrfToken?: unknown
      email?: unknown
      password?: unknown
    }
    const csrf = typeof body.csrfToken === 'string' ? body.csrfToken : ''
    if (!verifyAuthCsrf(req.headers.get('cookie'), csrf)) {
      return NextResponse.json({ error: '请求无效' }, { status: 400 })
    }

    const session = await auth()
    let userId: string | null = null

    if (session?.mfaPending && session.user?.id) {
      userId = session.user.id
    } else {
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
      const password = typeof body.password === 'string' ? body.password : ''
      if (!email || !password) {
        return NextResponse.json({ error: '请提供邮箱与密码' }, { status: 400 })
      }
      const user = await findUserByEmail(email)
      if (!user?.password || !verifyStoredPassword(user.password, password)) {
        return NextResponse.json({ error: '凭证无效' }, { status: 400 })
      }
      userId = user.id
    }

    const user = await getUserByIdGlobal(userId)
    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 })

    const mfa = await getUserMfaRow(userId)
    if (!mfa?.mfaEnabled) {
      return NextResponse.json({ error: '未开启 MFA' }, { status: 400 })
    }

    const plain = newRecoveryPlainToken()
    const tokenHash = hashRecoveryToken(plain)
    const expiresAt = new Date(Date.now() + 3600_000).toISOString()
    await insertMfaRecoveryToken(userId, tokenHash, expiresAt)

    const link = `${getAppBaseUrl()}/recover/mfa?token=${encodeURIComponent(plain)}`
    logRecovery(user.email, link)

    return NextResponse.json({ ok: true, message: '若邮箱服务已配置，将收到恢复链接（开发环境见服务器日志）' })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '请求失败' }, { status: 500 })
  }
}
