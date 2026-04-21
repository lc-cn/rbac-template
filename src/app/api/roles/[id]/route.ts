import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        users: { include: { user: true } },
        permissions: { include: { permission: true } },
      },
    })
    
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
    
    await prisma.rolePermission.deleteMany({ where: { roleId: id } })
    
    const role = await prisma.role.update({
      where: { id },
      data: {
        name,
        description,
        permissions: permissionIds ? {
          create: permissionIds.map((permissionId: string) => ({ permissionId })),
        } : undefined,
      },
      include: {
        users: { include: { user: true } },
        permissions: { include: { permission: true } },
      },
    })
    
    return NextResponse.json(role)
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ error: '角色名已存在' }, { status: 400 })
    return NextResponse.json({ error: '更新角色失败' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.role.delete({ where: { id } })
    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    return NextResponse.json({ error: '删除角色失败' }, { status: 500 })
  }
}
