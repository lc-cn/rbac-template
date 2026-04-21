import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const app = await prisma.application.findUnique({
      where: { id },
      include: { features: { include: { permissions: true } } },
    })
    if (!app) return NextResponse.json({ error: '应用不存在' }, { status: 404 })
    return NextResponse.json(app)
  } catch (error) {
    return NextResponse.json({ error: '获取应用失败' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, code, description, status } = body
    
    const app = await prisma.application.update({
      where: { id },
      data: { name, code, description, status },
      include: { features: { include: { permissions: true } } },
    })
    return NextResponse.json(app)
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ error: '应用名或编码已存在' }, { status: 400 })
    return NextResponse.json({ error: '更新应用失败' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.application.delete({ where: { id } })
    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    return NextResponse.json({ error: '删除应用失败' }, { status: 500 })
  }
}
