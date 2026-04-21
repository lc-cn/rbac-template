import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    
    const users = await prisma.user.findMany({
      where: search ? {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
        ],
      } : {},
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    
    return NextResponse.json(users)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: '获取用户列表失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, avatar, status, roleIds } = body
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password,
        avatar,
        status: status ?? true,
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
    
    return NextResponse.json(user, { status: 201 })
  } catch (error: any) {
    console.error(error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: '邮箱已存在' }, { status: 400 })
    }
    return NextResponse.json({ error: '创建用户失败' }, { status: 500 })
  }
}
