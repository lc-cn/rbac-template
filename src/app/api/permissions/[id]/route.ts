import { NextRequest, NextResponse } from 'next/server'
import { deletePermission, getPermissionById, isUniqueConstraintError, updatePermission } from '@/lib/data-access'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const permission = await getPermissionById(id)
    if (!permission) return NextResponse.json({ error: '权限不存在' }, { status: 404 })
    return NextResponse.json(permission)
  } catch (error) {
    return NextResponse.json({ error: '获取权限失败' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, code, description, featureId } = body
    const permission = await updatePermission(id, { name, code, description, featureId })
    return NextResponse.json(permission)
  } catch (error: unknown) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: '权限编码已存在' }, { status: 400 })
    }
    return NextResponse.json({ error: '更新权限失败' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await deletePermission(id)
    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    return NextResponse.json({ error: '删除权限失败' }, { status: 500 })
  }
}
