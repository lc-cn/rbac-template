import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const applicationId = searchParams.get('applicationId') || ''
    
    const features = await prisma.feature.findMany({
      where: {
        ...(applicationId ? { applicationId } : {}),
        ...(search ? {
          OR: [
            { name: { contains: search } },
            { code: { contains: search } },
          ],
        } : {}),
      },
      include: {
        application: true,
        permissions: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    
    return NextResponse.json(features)
  } catch (error) {
    return NextResponse.json({ error: '获取功能列表失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, code, description, applicationId } = body
    
    const feature = await prisma.feature.create({
      data: { name, code, description, applicationId },
      include: { application: true, permissions: true },
    })
    
    return NextResponse.json(feature, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ error: '该应用下功能编码已存在' }, { status: 400 })
    return NextResponse.json({ error: '创建功能失败' }, { status: 500 })
  }
}
