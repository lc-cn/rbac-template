import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const permission = await prisma.permission.findUnique({
      where: { id },
      include: { feature: { include: { application: true } } },
    })
    if (!permission) return NextResponse.json({ error: '权限不存在' }, { status: 404 })
    return NextResponse.json(permission)
  } catch (error) {
    return NextResponse.json({ error: '获取权限失败' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, code, description, featureId } = body
    
    const permission = await prisma.permission.update({
      where: { id },
      data: { name, code, description, featureId },
      include: { feature: { include: { application: true } } },
    })
    return NextResponse.json(permission)
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ error: '权限编码已存在' }, { status: 400 })
    return NextResponse.json({ error: '更新权限失败' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.permission.delete({ where: { id } })
    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    return NextResponse.json({ error: '删除权限失败' }, { status: 500 })
  }
}
