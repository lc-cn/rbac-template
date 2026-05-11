import { NextRequest, NextResponse } from 'next/server'
import { verifyRegistrationResponse } from '@simplewebauthn/server'
import type { RegistrationResponseJSON } from '@simplewebauthn/types'
import { verifyAuthCsrf } from '@/lib/auth-csrf'
import { requireBusinessSession } from '@/lib/console-auth'
import {
  consumeWebAuthnChallenge,
  insertWebAuthnCredential,
  pruneExpiredWebAuthnChallenges,
} from '@/lib/security-data-access'
import { getWebAuthnExpectedOrigin, getWebAuthnRpId } from '@/lib/webauthn-rp'

export async function POST(req: NextRequest) {
  try {
    const gate = await requireBusinessSession()
    if (!gate.ok) return gate.response

    await pruneExpiredWebAuthnChallenges()
    const body = (await req.json()) as {
      csrfToken?: unknown
      challengeId?: unknown
      credential?: RegistrationResponseJSON
    }
    const csrf = typeof body.csrfToken === 'string' ? body.csrfToken : ''
    const challengeId = typeof body.challengeId === 'string' ? body.challengeId : ''
    const credential = body.credential
    if (!credential || !challengeId || !verifyAuthCsrf(req.headers.get('cookie'), csrf)) {
      return NextResponse.json({ error: '请求无效' }, { status: 400 })
    }

    const consumed = await consumeWebAuthnChallenge(challengeId, 'register_authenticated')
    if (!consumed || consumed.userId !== gate.userId || !consumed.metadata) {
      return NextResponse.json({ error: '挑战已过期，请重试' }, { status: 400 })
    }

    let canLogin = false
    let canMfa = false
    let label: string | null = null
    try {
      const meta = JSON.parse(consumed.metadata) as { canLogin?: boolean; canMfa?: boolean; label?: string | null }
      canLogin = !!meta.canLogin
      canMfa = !!meta.canMfa
      label = meta.label ?? null
    } catch {
      return NextResponse.json({ error: '挑战无效' }, { status: 400 })
    }
    if (!canLogin && !canMfa) {
      return NextResponse.json({ error: '挑战无效' }, { status: 400 })
    }

    const verified = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: consumed.challenge,
      expectedOrigin: getWebAuthnExpectedOrigin(),
      expectedRPID: getWebAuthnRpId(),
      requireUserVerification: false,
    })

    if (!verified.verified || !verified.registrationInfo) {
      return NextResponse.json({ error: 'Passkey 注册验证失败' }, { status: 400 })
    }

    const info = verified.registrationInfo
    const cred = info.credential
    const credId = cred.id
    const pub = Buffer.from(cred.publicKey).toString('base64url')
    const transports = cred.transports?.length ? JSON.stringify(cred.transports) : null

    await insertWebAuthnCredential({
      userId: gate.userId,
      credentialId: credId,
      publicKey: pub,
      counter: cred.counter,
      transports,
      canLogin,
      canMfa,
      label,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Passkey 注册失败' }, { status: 500 })
  }
}
