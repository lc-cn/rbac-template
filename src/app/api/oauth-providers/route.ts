import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const providers = await prisma.oAuthProvider.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(providers)
  } catch (error) {
    return NextResponse.json({ error: '获取OAuth提供商失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, clientId, clientSecret, enabled } = body
    
    const provider = await prisma.oAuthProvider.create({
      data: { name, type, clientId, clientSecret, enabled: enabled ?? false },
    })
    
    return NextResponse.json(provider, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ error: '提供商名称已存在' }, { status: 400 })
    return NextResponse.json({ error: '创建OAuth提供商失败' }, { status: 500 })
  }
}
