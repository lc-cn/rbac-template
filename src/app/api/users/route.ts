import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createUser, isUniqueConstraintError, listUsers } from '@/lib/data-access'
import { requireTenantId } from '@/lib/tenant-server'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const tenantRes = requireTenantId(session)
    if (tenantRes instanceof NextResponse) return tenantRes
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const users = await listUsers(tenantRes, search)
    return NextResponse.json(users)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: '获取用户列表失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const tenantRes = requireTenantId(session)
    if (tenantRes instanceof NextResponse) return tenantRes
    const body = await request.json()
    const { name, email, password, avatar, status, roleIds } = body
    const user = await createUser({
      tenantId: tenantRes,
      name,
      email,
      password,
      avatar,
      status,
      roleIds,
    })
    return NextResponse.json(user, { status: 201 })
  } catch (error: unknown) {
    console.error(error)
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: '邮箱已存在' }, { status: 400 })
    }
    return NextResponse.json({ error: '创建用户失败' }, { status: 500 })
  }
}
