import { NextRequest, NextResponse } from 'next/server'
import { generateRegistrationOptions } from '@simplewebauthn/server'
import { verifyAuthCsrf } from '@/lib/auth-csrf'
import { requireBusinessSession } from '@/lib/console-auth'
import { insertWebAuthnChallenge, pruneExpiredWebAuthnChallenges } from '@/lib/security-data-access'
import { resolveTotpIssuer } from '@/lib/mfa-totp'
import { getWebAuthnRpId } from '@/lib/webauthn-rp'

export async function POST(req: NextRequest) {
  try {
    const gate = await requireBusinessSession()
    if (!gate.ok) return gate.response

    await pruneExpiredWebAuthnChallenges()
    const body = (await req.json()) as {
      csrfToken?: unknown
      canLogin?: unknown
      canMfa?: unknown
      label?: unknown
    }
    const csrf = typeof body.csrfToken === 'string' ? body.csrfToken : ''
    if (!verifyAuthCsrf(req.headers.get('cookie'), csrf)) {
      return NextResponse.json({ error: '请求无效' }, { status: 400 })
    }

    const canLogin = body.canLogin === true
    const canMfa = body.canMfa === true
    if (!canLogin && !canMfa) {
      return NextResponse.json({ error: '请至少选择一种用途（登录 / MFA）' }, { status: 400 })
    }
    const label = typeof body.label === 'string' ? body.label.trim().slice(0, 80) : ''

    const rpName = await resolveTotpIssuer()
    const userId = gate.userId
    const email = gate.session.user.email ?? userId
    const name = gate.session.user.name ?? email

    const options = await generateRegistrationOptions({
      rpName,
      rpID: getWebAuthnRpId(),
      userName: email,
      userDisplayName: name,
      userID: Buffer.from(userId, 'utf8'),
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    })

    const expiresAt = new Date(Date.now() + 300_000).toISOString()
    const challengeId = await insertWebAuthnChallenge({
      challenge: options.challenge,
      userId,
      kind: 'register_authenticated',
      email: null,
      metadata: JSON.stringify({ canLogin, canMfa, label: label || null }),
      expiresAtIso: expiresAt,
    })

    return NextResponse.json({ options, challengeId })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '注册选项生成失败' }, { status: 500 })
  }
}
