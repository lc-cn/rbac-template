import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const provider = await prisma.oAuthProvider.findUnique({ where: { id } })
    if (!provider) return NextResponse.json({ error: '提供商不存在' }, { status: 404 })
    return NextResponse.json(provider)
  } catch (error) {
    return NextResponse.json({ error: '获取OAuth提供商失败' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, type, clientId, clientSecret, enabled } = body
    
    const provider = await prisma.oAuthProvider.update({
      where: { id },
      data: { name, type, clientId, clientSecret, enabled },
    })
    return NextResponse.json(provider)
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ error: '提供商名称已存在' }, { status: 400 })
    return NextResponse.json({ error: '更新OAuth提供商失败' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.oAuthProvider.delete({ where: { id } })
    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    return NextResponse.json({ error: '删除OAuth提供商失败' }, { status: 500 })
  }
}
