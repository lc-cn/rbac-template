import { NextRequest, NextResponse } from 'next/server'
import { deleteApplication, getApplicationById, isUniqueConstraintError, updateApplication } from '@/lib/data-access'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const app = await getApplicationById(id)
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
    const app = await updateApplication(id, { name, code, description, status })
    return NextResponse.json(app)
  } catch (error: unknown) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: '应用名或编码已存在' }, { status: 400 })
    }
    return NextResponse.json({ error: '更新应用失败' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await deleteApplication(id)
    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    return NextResponse.json({ error: '删除应用失败' }, { status: 500 })
  }
}
