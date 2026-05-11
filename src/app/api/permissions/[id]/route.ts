import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { deletePermission, getPermissionById, isUniqueConstraintError, updatePermission } from '@/lib/data-access'
import { requireTenantId } from '@/lib/tenant-server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const tenantRes = requireTenantId(session)
    if (tenantRes instanceof NextResponse) return tenantRes
    const { id } = await params
    const permission = await getPermissionById(id, tenantRes)
    if (!permission) return NextResponse.json({ error: '权限不存在' }, { status: 404 })
    return NextResponse.json(permission)
  } catch (error) {
    return NextResponse.json({ error: '获取权限失败' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const tenantRes = requireTenantId(session)
    if (tenantRes instanceof NextResponse) return tenantRes
    const { id } = await params
    const body = await request.json()
    const { name, code, description, featureId } = body
    const permission = await updatePermission(id, tenantRes, { name, code, description, featureId })
    if (!permission) return NextResponse.json({ error: '权限或功能无效' }, { status: 400 })
    return NextResponse.json(permission)
  } catch (error: unknown) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: '该功能下权限编码已存在' }, { status: 400 })
    }
    return NextResponse.json({ error: '更新权限失败' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const tenantRes = requireTenantId(session)
    if (tenantRes instanceof NextResponse) return tenantRes
    const { id } = await params
    await deletePermission(id, tenantRes)
    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    return NextResponse.json({ error: '删除权限失败' }, { status: 500 })
  }
}
