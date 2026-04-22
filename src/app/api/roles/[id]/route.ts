import { NextRequest, NextResponse } from 'next/server'
import { deleteRole, getRoleById, isUniqueConstraintError, updateRole } from '@/lib/data-access'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const role = await getRoleById(id)
    if (!role) return NextResponse.json({ error: '角色不存在' }, { status: 404 })
    return NextResponse.json(role)
  } catch (error) {
    return NextResponse.json({ error: '获取角色失败' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, permissionIds } = body
    const role = await updateRole(id, { name, description, permissionIds })
    return NextResponse.json(role)
  } catch (error: unknown) {
    if (isUniqueConstraintError(error)) return NextResponse.json({ error: '角色名已存在' }, { status: 400 })
    return NextResponse.json({ error: '更新角色失败' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await deleteRole(id)
    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    return NextResponse.json({ error: '删除角色失败' }, { status: 500 })
  }
}
