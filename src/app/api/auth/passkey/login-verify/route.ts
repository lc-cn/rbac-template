import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthenticationResponse } from '@simplewebauthn/server'
import type { AuthenticationResponseJSON } from '@simplewebauthn/types'
import { verifyAuthCsrf } from '@/lib/auth-csrf'
import { sessionCookieSecure } from '@/lib/auth-cookie'
import { buildMfaPendingClaims, buildSessionJwtClaims } from '@/lib/auth-token-build'
import { SESSION_MAX_AGE, setSessionTokenOnResponse } from '@/lib/session-cookie-set'
import {
  consumeWebAuthnChallenge,
  getUserMfaRow,
  getWebAuthnCredentialByCredentialId,
  pruneExpiredWebAuthnChallenges,
  updateWebAuthnCredentialCounter,
} from '@/lib/security-data-access'
import { getWebAuthnExpectedOrigin, getWebAuthnRpId } from '@/lib/webauthn-rp'

export async function POST(req: NextRequest) {
  try {
    await pruneExpiredWebAuthnChallenges()
    const body = (await req.json()) as {
      csrfToken?: unknown
      challengeId?: unknown
      credential?: AuthenticationResponseJSON
    }
    const csrf = typeof body.csrfToken === 'string' ? body.csrfToken : ''
    const challengeId = typeof body.challengeId === 'string' ? body.challengeId : ''
    const credential = body.credential
    if (!credential || !challengeId || !verifyAuthCsrf(req.headers.get('cookie'), csrf)) {
      return NextResponse.json({ error: '请求无效' }, { status: 400 })
    }

    const consumed = await consumeWebAuthnChallenge(challengeId, 'authenticate_login')
    if (!consumed || !consumed.metadata) {
      return NextResponse.json({ error: '挑战已过期，请重试' }, { status: 400 })
    }
    let userId: string
    try {
      const meta = JSON.parse(consumed.metadata) as { userId?: string }
      if (!meta.userId) throw new Error('no user')
      userId = meta.userId
    } catch {
      return NextResponse.json({ error: '挑战无效' }, { status: 400 })
    }

    const credId = credential.id
    const row = await getWebAuthnCredentialByCredentialId(credId)
    if (!row || row.userId !== userId || !row.canLogin) {
      return NextResponse.json({ error: '凭据无效' }, { status: 400 })
    }

    const verified = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: consumed.challenge,
      expectedOrigin: getWebAuthnExpectedOrigin(),
      expectedRPID: getWebAuthnRpId(),
      credential: {
        id: row.credentialId,
        publicKey: Buffer.from(row.publicKey, 'base64url'),
        counter: row.counter,
        transports: row.transports ? (JSON.parse(row.transports) as ('ble' | 'internal' | 'usb' | 'hybrid' | 'nfc' | 'cable' | 'smart-card')[]) : [],
      },
      requireUserVerification: false,
    })

    if (!verified.verified) {
      return NextResponse.json({ error: 'Passkey 验证失败' }, { status: 400 })
    }

    await updateWebAuthnCredentialCounter(row.credentialId, verified.authenticationInfo.newCounter)

    const mfaRow = await getUserMfaRow(userId)
    const secure = sessionCookieSecure(req)
    const res = NextResponse.json({
      ok: true,
      mfaPending: !!(mfaRow?.mfaEnabled ?? false),
    })

    if (mfaRow?.mfaEnabled) {
      const claims = await buildMfaPendingClaims(userId)
      await setSessionTokenOnResponse(res, claims, { secure, maxAgeSec: SESSION_MAX_AGE })
    } else {
      const claims = await buildSessionJwtClaims(userId)
      await setSessionTokenOnResponse(res, claims, { secure, maxAgeSec: SESSION_MAX_AGE })
    }

    return res
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Passkey 登录失败' }, { status: 500 })
  }
}
