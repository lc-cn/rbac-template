import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthCsrf } from '@/lib/auth-csrf'
import { getUserByIdGlobal } from '@/lib/data-access'
import { verifyStoredPassword } from '@/lib/password'
import { requireBusinessSession } from '@/lib/console-auth'
import { buildTotpAuthUri, newTotpSecret, resolveTotpIssuer } from '@/lib/mfa-totp'
import { sealSecret } from '@/lib/secrets-aead'
import { getUserMfaRow, insertWebAuthnChallenge, pruneExpiredWebAuthnChallenges } from '@/lib/security-data-access'

export async function POST(req: NextRequest) {
  try {
    const gate = await requireBusinessSession()
    if (!gate.ok) return gate.response

    const user = await getUserByIdGlobal(gate.userId)
    if (!user?.password || !user.password.trim()) {
      return NextResponse.json({ error: '开启 MFA 前须先设置登录密码' }, { status: 400 })
    }

    const existing = await getUserMfaRow(gate.userId)
    if (existing?.mfaEnabled) {
      return NextResponse.json({ error: 'MFA 已开启' }, { status: 400 })
    }

    await pruneExpiredWebAuthnChallenges()
    const body = (await req.json()) as { csrfToken?: unknown; password?: unknown }
    const csrf = typeof body.csrfToken === 'string' ? body.csrfToken : ''
    const password = typeof body.password === 'string' ? body.password : ''
    if (!password || !verifyAuthCsrf(req.headers.get('cookie'), csrf)) {
      return NextResponse.json({ error: '请求无效' }, { status: 400 })
    }
    if (!verifyStoredPassword(user.password, password)) {
      return NextResponse.json({ error: '密码错误' }, { status: 400 })
    }

    const secret = newTotpSecret()
    const issuer = await resolveTotpIssuer()
    const otpauthUrl = buildTotpAuthUri({ secret, issuer, accountEmail: user.email })
    const sealed = sealSecret(secret, `mfa_totp_setup:${gate.userId}`)
    const expiresAt = new Date(Date.now() + 600_000).toISOString()
    const challengeId = await insertWebAuthnChallenge({
      challenge: crypto.randomUUID(),
      userId: gate.userId,
      kind: 'mfa_totp_setup',
      email: null,
      metadata: JSON.stringify({ sealed }),
      expiresAtIso: expiresAt,
    })

    return NextResponse.json({ challengeId, otpauthUrl })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '准备失败' }, { status: 500 })
  }
}
