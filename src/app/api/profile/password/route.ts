import { NextRequest, NextResponse } from 'next/server'
import { changeUserPassword } from '@/lib/data-access'
import { getServerAuthSession } from '@/lib/session'

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerAuthSession()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: '未登录' }, { status: 401 })

    const body = (await request.json()) as { currentPassword?: unknown; newPassword?: unknown }
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''
    if (newPassword.length < 6) return NextResponse.json({ error: '新密码至少 6 位' }, { status: 400 })

    const currentPassword =
      typeof body.currentPassword === 'string' ? body.currentPassword : undefined

    const r = await changeUserPassword(userId, {
      currentPassword,
      newPassword,
    })

    if (r.error === 'not_found') return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    if (r.error === 'invalid_current') return NextResponse.json({ error: '当前密码不正确' }, { status: 400 })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '修改密码失败' }, { status: 500 })
  }
}
