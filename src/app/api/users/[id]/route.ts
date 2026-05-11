import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getUserById, isUniqueConstraintError, removeUserFromTenant, updateUser } from '@/lib/data-access'
import { requireTenantId } from '@/lib/tenant-server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const tenantRes = requireTenantId(session)
    if (tenantRes instanceof NextResponse) return tenantRes
    const { id } = await params
    const user = await getUserById(id, tenantRes)
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
    const session = await auth()
    const tenantRes = requireTenantId(session)
    if (tenantRes instanceof NextResponse) return tenantRes
    const { id } = await params
    const body = await request.json()
    const { name, email, password, avatar, status, roleIds } = body
    const user = await updateUser(id, tenantRes, {
      name,
      email,
      ...(password ? { password } : {}),
      avatar,
      status,
      roleIds,
    })
    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 })
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
    const session = await auth()
    const tenantRes = requireTenantId(session)
    if (tenantRes instanceof NextResponse) return tenantRes
    const { id } = await params
    await removeUserFromTenant(tenantRes, id)
    return NextResponse.json({ message: '已从当前租户移除' })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: '移除用户失败' }, { status: 500 })
  }
}
