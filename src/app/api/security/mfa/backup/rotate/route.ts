import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthCsrf } from '@/lib/auth-csrf'
import { getUserByIdGlobal } from '@/lib/data-access'
import { verifyStoredPassword } from '@/lib/password'
import { requireBusinessSession } from '@/lib/console-auth'
import { issueMfaBackupCodes } from '@/lib/mfa-enable-shared'
import { getUserMfaRow } from '@/lib/security-data-access'

export async function POST(req: NextRequest) {
  try {
    const gate = await requireBusinessSession()
    if (!gate.ok) return gate.response

    const user = await getUserByIdGlobal(gate.userId)
    if (!user?.password || !user.password.trim()) {
      return NextResponse.json({ error: '无法验证密码' }, { status: 400 })
    }

    const cur = await getUserMfaRow(gate.userId)
    if (!cur?.mfaEnabled) {
      return NextResponse.json({ error: 'MFA 未开启' }, { status: 400 })
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

    const backupCodes = await issueMfaBackupCodes(gate.userId)
    return NextResponse.json({ ok: true, backupCodes })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '轮换失败' }, { status: 500 })
  }
}
