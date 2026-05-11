import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthenticationResponse } from '@simplewebauthn/server'
import type { AuthenticationResponseJSON } from '@simplewebauthn/types'
import { verifyAuthCsrf } from '@/lib/auth-csrf'
import { sessionCookieSecure } from '@/lib/auth-cookie'
import { buildSessionJwtClaims } from '@/lib/auth-token-build'
import { requireMfaPendingSession } from '@/lib/mfa-session-gate'
import { hashBackupCode, normalizeBackupCodeInput } from '@/lib/mfa-backup-codes'
import { verifyTotp } from '@/lib/mfa-totp'
import { openSecret } from '@/lib/secrets-aead'
import { SESSION_MAX_AGE, clearSessionCookieOnResponse, setSessionTokenOnResponse } from '@/lib/session-cookie-set'
import {
  consumeWebAuthnChallenge,
  getUserMfaRow,
  getWebAuthnCredentialByCredentialId,
  mfaFailIncrementAndCheckRevoke,
  tryConsumeBackupCode,
  updateWebAuthnCredentialCounter,
} from '@/lib/security-data-access'
import { getWebAuthnExpectedOrigin, getWebAuthnRpId } from '@/lib/webauthn-rp'

function clientIp(req: NextRequest): string {
  const x = req.headers.get('x-forwarded-for')
  if (x) return x.split(',')[0]?.trim() || 'unknown'
  return req.headers.get('x-real-ip')?.trim() || 'unknown'
}

export async function POST(req: NextRequest) {
  try {
    const gate = await requireMfaPendingSession()
    if (!gate.ok) return gate.response

    const body = (await req.json()) as {
      csrfToken?: unknown
      kind?: unknown
      totp?: unknown
      backupCode?: unknown
      passkey?: { challengeId?: unknown; credential?: AuthenticationResponseJSON }
    }
    const csrf = typeof body.csrfToken === 'string' ? body.csrfToken : ''
    if (!verifyAuthCsrf(req.headers.get('cookie'), csrf)) {
      return NextResponse.json({ error: '请求无效' }, { status: 400 })
    }

    const kind = typeof body.kind === 'string' ? body.kind : ''
    const userId = gate.userId
    const mfaRow = await getUserMfaRow(userId)
    if (!mfaRow?.mfaEnabled) {
      return NextResponse.json({ error: '未开启 MFA' }, { status: 400 })
    }

    const secure = sessionCookieSecure(req)
    const nowSec = Math.floor(Date.now() / 1000)
    const ip = clientIp(req)

    async function onFail(): Promise<NextResponse> {
      const { revoke } = await mfaFailIncrementAndCheckRevoke({ userId, clientIp: ip, nowSec })
      const res = NextResponse.json({ error: '验证失败' }, { status: 400 })
      if (revoke) {
        clearSessionCookieOnResponse(res, secure)
      }
      return res
    }

    let ok = false

    if (kind === 'totp') {
      const code = typeof body.totp === 'string' ? body.totp : ''
      if (!mfaRow.totpSecretEnc) return onFail()
      try {
        const secret = openSecret(mfaRow.totpSecretEnc, `user:${userId}:totp`)
        ok = verifyTotp(secret, code)
      } catch {
        ok = false
      }
    } else if (kind === 'backup') {
      const raw = typeof body.backupCode === 'string' ? body.backupCode : ''
      const norm = normalizeBackupCodeInput(raw)
      if (!norm || !mfaRow.backupCodesSalt) {
        return onFail()
      }
      const h = hashBackupCode(norm, userId, mfaRow.backupCodesSalt)
      ok = await tryConsumeBackupCode(userId, h)
    } else if (kind === 'passkey') {
      const challengeId = typeof body.passkey?.challengeId === 'string' ? body.passkey.challengeId : ''
      const credential = body.passkey?.credential
      if (!credential || !challengeId) return NextResponse.json({ error: '请求无效' }, { status: 400 })

      const consumed = await consumeWebAuthnChallenge(challengeId, 'authenticate_mfa')
      if (!consumed || consumed.userId !== userId) {
        return NextResponse.json({ error: '挑战已过期，请重试' }, { status: 400 })
      }

      const row = await getWebAuthnCredentialByCredentialId(credential.id)
      if (!row || row.userId !== userId || !row.canMfa) {
        return onFail()
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
          transports: row.transports
            ? (JSON.parse(row.transports) as ('ble' | 'internal' | 'usb' | 'hybrid' | 'nfc' | 'cable' | 'smart-card')[])
            : [],
        },
        requireUserVerification: true,
      })

      ok = verified.verified
      if (ok) {
        await updateWebAuthnCredentialCounter(row.credentialId, verified.authenticationInfo.newCounter)
      }
    } else {
      return NextResponse.json({ error: '未知验证类型' }, { status: 400 })
    }

    if (!ok) {
      return onFail()
    }

    const claims = await buildSessionJwtClaims(userId)
    const res = NextResponse.json({ ok: true })
    await setSessionTokenOnResponse(res, claims, { secure, maxAgeSec: SESSION_MAX_AGE })
    return res
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'MFA 验证失败' }, { status: 500 })
  }
}
