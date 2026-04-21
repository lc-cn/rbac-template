import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const feature = await prisma.feature.findUnique({
      where: { id },
      include: { application: true, permissions: true },
    })
    if (!feature) return NextResponse.json({ error: '功能不存在' }, { status: 404 })
    return NextResponse.json(feature)
  } catch (error) {
    return NextResponse.json({ error: '获取功能失败' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, code, description, applicationId } = body
    
    const feature = await prisma.feature.update({
      where: { id },
      data: { name, code, description, applicationId },
      include: { application: true, permissions: true },
    })
    return NextResponse.json(feature)
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ error: '该应用下功能编码已存在' }, { status: 400 })
    return NextResponse.json({ error: '更新功能失败' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.feature.delete({ where: { id } })
    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    return NextResponse.json({ error: '删除功能失败' }, { status: 500 })
  }
}
