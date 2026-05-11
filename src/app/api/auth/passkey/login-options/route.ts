import { NextRequest, NextResponse } from 'next/server'
import { generateAuthenticationOptions } from '@simplewebauthn/server'
import { findUserByEmail } from '@/lib/data-access'
import { verifyAuthCsrf } from '@/lib/auth-csrf'
import {
  insertWebAuthnChallenge,
  listWebAuthnCredentials,
  pruneExpiredWebAuthnChallenges,
} from '@/lib/security-data-access'
import { getWebAuthnRpId } from '@/lib/webauthn-rp'

export async function POST(req: NextRequest) {
  try {
    await pruneExpiredWebAuthnChallenges()
    const body = (await req.json()) as { email?: unknown; csrfToken?: unknown }
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const csrf = typeof body.csrfToken === 'string' ? body.csrfToken : ''
    if (!email || !verifyAuthCsrf(req.headers.get('cookie'), csrf)) {
      return NextResponse.json({ error: '请求无效' }, { status: 400 })
    }

    const user = await findUserByEmail(email)
    if (!user || !user.status) {
      return NextResponse.json({ error: '用户不存在或未启用' }, { status: 404 })
    }

    const creds = await listWebAuthnCredentials(user.id)
    const loginCreds = creds.filter((c) => c.canLogin)
    if (!loginCreds.length) {
      return NextResponse.json({ error: '未注册可用于登录的 Passkey' }, { status: 400 })
    }

    const options = await generateAuthenticationOptions({
      rpID: getWebAuthnRpId(),
      allowCredentials: loginCreds.map((c) => {
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
      userVerification: 'preferred',
    })

    const expiresAt = new Date(Date.now() + 300_000).toISOString()
    const challengeId = await insertWebAuthnChallenge({
      challenge: options.challenge,
      userId: null,
      kind: 'authenticate_login',
      email: user.email,
      metadata: JSON.stringify({ userId: user.id }),
      expiresAtIso: expiresAt,
    })

    return NextResponse.json({ options, challengeId })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Passkey 登录准备失败' }, { status: 500 })
  }
}
