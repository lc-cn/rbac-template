import { NextRequest, NextResponse } from 'next/server'
import { deleteUser, getUserById, isUniqueConstraintError, updateUser } from '@/lib/data-access'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getUserById(id)
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }
    return NextResponse.json(user)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: '获取用户失败' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, email, password, avatar, status, roleIds } = body
    const user = await updateUser(id, {
      name,
      email,
      ...(password ? { password } : {}),
      avatar,
      status,
      roleIds,
    })
    return NextResponse.json(user)
  } catch (error: unknown) {
    console.error(error)
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: '邮箱已存在' }, { status: 400 })
    }
    return NextResponse.json({ error: '更新用户失败' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await deleteUser(id)
    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: '删除用户失败' }, { status: 500 })
  }
}
