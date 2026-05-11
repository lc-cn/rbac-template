import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthCsrf } from '@/lib/auth-csrf'
import { getUserByIdGlobal } from '@/lib/data-access'
import { verifyStoredPassword } from '@/lib/password'
import { requireBusinessSession } from '@/lib/console-auth'
import { issueMfaBackupCodes } from '@/lib/mfa-enable-shared'
import { openSecret, sealSecret } from '@/lib/secrets-aead'
import { verifyTotp } from '@/lib/mfa-totp'
import {
  consumeWebAuthnChallenge,
  getUserMfaRow,
  upsertUserMfaRow,
} from '@/lib/security-data-access'

export async function POST(req: NextRequest) {
  try {
    const gate = await requireBusinessSession()
    if (!gate.ok) return gate.response

    const user = await getUserByIdGlobal(gate.userId)
    if (!user?.password || !user.password.trim()) {
      return NextResponse.json({ error: '开启 MFA 前须先设置登录密码' }, { status: 400 })
    }

    const cur = await getUserMfaRow(gate.userId)
    if (cur?.mfaEnabled) {
      return NextResponse.json({ error: 'MFA 已开启' }, { status: 400 })
    }

    const body = (await req.json()) as {
      csrfToken?: unknown
      password?: unknown
      challengeId?: unknown
      totpCode?: unknown
    }
    const csrf = typeof body.csrfToken === 'string' ? body.csrfToken : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const challengeId = typeof body.challengeId === 'string' ? body.challengeId : ''
    const totpCode = typeof body.totpCode === 'string' ? body.totpCode : ''
    if (!verifyAuthCsrf(req.headers.get('cookie'), csrf)) {
      return NextResponse.json({ error: '请求无效' }, { status: 400 })
    }
    if (!password || !verifyStoredPassword(user.password, password)) {
      return NextResponse.json({ error: '密码错误' }, { status: 400 })
    }

    const consumed = await consumeWebAuthnChallenge(challengeId, 'mfa_totp_setup')
    if (!consumed || consumed.userId !== gate.userId || !consumed.metadata) {
      return NextResponse.json({ error: '设置已过期，请重新开始' }, { status: 400 })
    }
    let sealedSetup: string
    try {
      sealedSetup = (JSON.parse(consumed.metadata) as { sealed?: string }).sealed ?? ''
    } catch {
      return NextResponse.json({ error: '挑战无效' }, { status: 400 })
    }
    if (!sealedSetup) return NextResponse.json({ error: '挑战无效' }, { status: 400 })

    const secret = openSecret(sealedSetup, `mfa_totp_setup:${gate.userId}`)
    if (!verifyTotp(secret, totpCode)) {
      return NextResponse.json({ error: '验证码错误' }, { status: 400 })
    }

    const totpSecretEnc = sealSecret(secret, `user:${gate.userId}:totp`)
    await upsertUserMfaRow(gate.userId, { mfaEnabled: true, totpSecretEnc, backupCodesSalt: null })
    const backupCodes = await issueMfaBackupCodes(gate.userId)

    return NextResponse.json({ ok: true, backupCodes })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '确认失败' }, { status: 500 })
  }
}
