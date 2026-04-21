import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    
    const apps = await prisma.application.findMany({
      where: search ? {
        OR: [
          { name: { contains: search } },
          { code: { contains: search } },
        ],
      } : {},
      include: { features: { include: { permissions: true } } },
      orderBy: { createdAt: 'desc' },
    })
    
    return NextResponse.json(apps)
  } catch (error) {
    return NextResponse.json({ error: '获取应用列表失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, code, description, status } = body
    
    const app = await prisma.application.create({
      data: { name, code, description, status: status ?? true },
      include: { features: true },
    })
    
    return NextResponse.json(app, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ error: '应用名或编码已存在' }, { status: 400 })
    return NextResponse.json({ error: '创建应用失败' }, { status: 500 })
  }
}
