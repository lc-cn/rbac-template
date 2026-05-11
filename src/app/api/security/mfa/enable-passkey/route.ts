import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthCsrf } from '@/lib/auth-csrf'
import { getUserByIdGlobal } from '@/lib/data-access'
import { verifyStoredPassword } from '@/lib/password'
import { requireBusinessSession } from '@/lib/console-auth'
import { issueMfaBackupCodes } from '@/lib/mfa-enable-shared'
import { getUserMfaRow, listWebAuthnCredentials, upsertUserMfaRow } from '@/lib/security-data-access'

/** 第二因子为 MFA Passkey：至少一把 canMfa 凭据后，用密码确认开启 MFA */
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

    const passkeys = await listWebAuthnCredentials(gate.userId)
    if (!passkeys.some((p) => p.canMfa)) {
      return NextResponse.json({ error: '请先注册用途包含「MFA」的 Passkey' }, { status: 400 })
    }

    const body = (await req.json()) as { csrfToken?: unknown; password?: unknown }
    const csrf = typeof body.csrfToken === 'string' ? body.csrfToken : ''
    const password = typeof body.password === 'string' ? body.password : ''
    if (!verifyAuthCsrf(req.headers.get('cookie'), csrf)) {
      return NextResponse.json({ error: '请求无效' }, { status: 400 })
    }
    if (!password || !verifyStoredPassword(user.password, password)) {
      return NextResponse.json({ error: '密码错误' }, { status: 400 })
    }

    await upsertUserMfaRow(gate.userId, { mfaEnabled: true, totpSecretEnc: null, backupCodesSalt: null })
    const backupCodes = await issueMfaBackupCodes(gate.userId)

    return NextResponse.json({ ok: true, backupCodes })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '开启失败' }, { status: 500 })
  }
}
