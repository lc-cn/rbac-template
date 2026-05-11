import { NextResponse } from 'next/server'
import { getUserByIdGlobal } from '@/lib/data-access'
import { requireBusinessSession } from '@/lib/console-auth'
import { getUserMfaRow, listWebAuthnCredentials } from '@/lib/security-data-access'

export async function GET() {
  try {
    const gate = await requireBusinessSession()
    if (!gate.ok) return gate.response

    const user = await getUserByIdGlobal(gate.userId)
    const mfa = await getUserMfaRow(gate.userId)
    const passkeys = await listWebAuthnCredentials(gate.userId)

    return NextResponse.json({
      hasPassword: !!(user?.password && user.password.trim()),
      mfaEnabled: !!(mfa?.mfaEnabled ?? false),
      hasTotp: !!(mfa?.totpSecretEnc ?? false),
      hasMfaPasskey: passkeys.some((p) => p.canMfa),
      passkeys: passkeys.map((p) => ({
        id: p.id,
        label: p.label,
        canLogin: p.canLogin,
        canMfa: p.canMfa,
        createdAt: p.createdAt,
      })),
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '读取失败' }, { status: 500 })
  }
}
