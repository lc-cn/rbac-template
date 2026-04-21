import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: { role: true },
        },
      },
    })
    
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
    
    await prisma.userRole.deleteMany({ where: { userId: id } })
    
    const user = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        ...(password ? { password } : {}),
        avatar,
        status,
        roles: roleIds ? {
          create: roleIds.map((roleId: string) => ({ roleId })),
        } : undefined,
      },
      include: {
        roles: {
          include: { role: true },
        },
      },
    })
    
    return NextResponse.json(user)
  } catch (error: any) {
    console.error(error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: '邮箱已存在' }, { status: 400 })
    }
    return NextResponse.json({ error: '更新用户失败' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: '删除用户失败' }, { status: 500 })
  }
}
