import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const featureId = searchParams.get('featureId') || ''
    
    const permissions = await prisma.permission.findMany({
      where: {
        ...(featureId ? { featureId } : {}),
        ...(search ? {
          OR: [
            { name: { contains: search } },
            { code: { contains: search } },
          ],
        } : {}),
      },
      include: {
        feature: { include: { application: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    
    return NextResponse.json(permissions)
  } catch (error) {
    return NextResponse.json({ error: '获取权限列表失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, code, description, featureId } = body
    
    const permission = await prisma.permission.create({
      data: { name, code, description, featureId },
      include: { feature: { include: { application: true } } },
    })
    
    return NextResponse.json(permission, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ error: '权限编码已存在' }, { status: 400 })
    return NextResponse.json({ error: '创建权限失败' }, { status: 500 })
  }
}
