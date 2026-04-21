import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    
    const roles = await prisma.role.findMany({
      where: search ? {
        OR: [
          { name: { contains: search } },
          { description: { contains: search } },
        ],
      } : {},
      include: {
        users: { include: { user: true } },
        permissions: { include: { permission: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    
    return NextResponse.json(roles)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: '获取角色列表失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, permissionIds } = body
    
    const role = await prisma.role.create({
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
    
    return NextResponse.json(role, { status: 201 })
  } catch (error: any) {
    console.error(error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: '角色名已存在' }, { status: 400 })
    }
    return NextResponse.json({ error: '创建角色失败' }, { status: 500 })
  }
}
