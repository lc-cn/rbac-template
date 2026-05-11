import { NextRequest, NextResponse } from 'next/server'
import { generateAuthenticationOptions } from '@simplewebauthn/server'
import { verifyAuthCsrf } from '@/lib/auth-csrf'
import { requireMfaPendingSession } from '@/lib/mfa-session-gate'
import { insertWebAuthnChallenge, listWebAuthnCredentials, pruneExpiredWebAuthnChallenges } from '@/lib/security-data-access'
import { getWebAuthnRpId } from '@/lib/webauthn-rp'

export async function POST(req: NextRequest) {
  try {
    const gate = await requireMfaPendingSession()
    if (!gate.ok) return gate.response

    await pruneExpiredWebAuthnChallenges()
    const body = (await req.json()) as { csrfToken?: unknown }
    const csrf = typeof body.csrfToken === 'string' ? body.csrfToken : ''
    if (!verifyAuthCsrf(req.headers.get('cookie'), csrf)) {
      return NextResponse.json({ error: '请求无效' }, { status: 400 })
    }

    const creds = await listWebAuthnCredentials(gate.userId)
    const mfaCreds = creds.filter((c) => c.canMfa)
    if (!mfaCreds.length) {
      return NextResponse.json({ error: '未注册可用于 MFA 的 Passkey' }, { status: 400 })
    }

    const options = await generateAuthenticationOptions({
      rpID: getWebAuthnRpId(),
      allowCredentials: mfaCreds.map((c) => {
        let transports: ('ble' | 'cable' | 'hybrid' | 'internal' | 'nfc' | 'smart-card' | 'usb')[] | undefined
        if (c.transports) {
          try {
            transports = JSON.parse(c.transports) as ('ble' | 'cable' | 'hybrid' | 'internal' | 'nfc' | 'smart-card' | 'usb')[]
          } catch {
            transports = undefined
          }
        }
        return {
          id: c.credentialId,
          type: 'public-key' as const,
          transports,
        }
      }),
      userVerification: 'required',
    })

    const expiresAt = new Date(Date.now() + 300_000).toISOString()
    const challengeId = await insertWebAuthnChallenge({
      challenge: options.challenge,
      userId: gate.userId,
      kind: 'authenticate_mfa',
      email: null,
      metadata: null,
      expiresAtIso: expiresAt,
    })

    return NextResponse.json({ options, challengeId })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'MFA Passkey 选项生成失败' }, { status: 500 })
  }
}
