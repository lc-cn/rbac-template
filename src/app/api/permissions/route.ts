import { NextRequest, NextResponse } from 'next/server'
import { createPermission, isUniqueConstraintError, listPermissions } from '@/lib/data-access'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const featureId = searchParams.get('featureId') || ''
    const permissions = await listPermissions(search, featureId)
    return NextResponse.json(permissions)
  } catch (error) {
    return NextResponse.json({ error: '获取权限列表失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, code, description, featureId } = body
    const permission = await createPermission({ name, code, description, featureId })
    return NextResponse.json(permission, { status: 201 })
  } catch (error: unknown) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: '权限编码已存在' }, { status: 400 })
    }
    return NextResponse.json({ error: '创建权限失败' }, { status: 500 })
  }
}
