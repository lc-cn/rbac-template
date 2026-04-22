import { NextRequest, NextResponse } from 'next/server'
import {
  deleteUser,
  getUserById,
  listLinkedAccountsByUserId,
  updateUserSelfProfile,
  verifySelfDeleteAccount,
} from '@/lib/data-access'
import { getServerAuthSession } from '@/lib/session'

export async function GET() {
  try {
    const session = await getServerAuthSession()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: '未登录' }, { status: 401 })

    const user = await getUserById(userId)
    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 })

    const accounts = await listLinkedAccountsByUserId(userId)
    const hasPassword = !!(user.password && user.password.trim())

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        avatar: user.avatar,
        hasPassword,
      },
      accounts,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '获取资料失败' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerAuthSession()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: '未登录' }, { status: 401 })

    const body = (await request.json()) as {
      name?: unknown
      email?: unknown
      image?: unknown
      avatar?: unknown
    }

    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (!name) return NextResponse.json({ error: '姓名不能为空' }, { status: 400 })

    const email = typeof body.email === 'string' ? body.email.trim() : undefined
    const image = body.image === null || typeof body.image === 'string' ? body.image : undefined
    const avatar = body.avatar === null || typeof body.avatar === 'string' ? body.avatar : undefined

    const r = await updateUserSelfProfile(userId, {
      name,
      ...(email !== undefined ? { email } : {}),
      ...(image !== undefined ? { image } : {}),
      ...(avatar !== undefined ? { avatar } : {}),
    })

    if (r.error === 'not_found') return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    if (r.error === 'email_taken') return NextResponse.json({ error: '邮箱已被占用' }, { status: 400 })

    const user = await getUserById(userId)
    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 })

    const profileImage = user.image ?? user.avatar ?? null

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        avatar: user.avatar,
        hasPassword: !!(user.password && user.password.trim()),
      },
      sessionPatch: {
        name: user.name,
        email: user.email,
        image: profileImage,
      },
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '更新资料失败' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerAuthSession()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: '未登录' }, { status: 401 })

    const body = (await request.json()) as { password?: unknown; confirmEmail?: unknown }
    const password = typeof body.password === 'string' ? body.password : undefined
    const confirmEmail = typeof body.confirmEmail === 'string' ? body.confirmEmail : undefined

    const v = await verifySelfDeleteAccount(userId, { password, confirmEmail })
    if (!('ok' in v && v.ok)) {
      const err = 'error' in v ? v.error : 'invalid'
      if (err === 'not_found') return NextResponse.json({ error: '用户不存在' }, { status: 404 })
      return NextResponse.json({ error: '验证失败，请检查密码或确认邮箱' }, { status: 400 })
    }

    await deleteUser(userId)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '注销失败' }, { status: 500 })
  }
}
