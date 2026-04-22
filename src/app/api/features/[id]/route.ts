import { NextRequest, NextResponse } from 'next/server'
import { deleteFeature, getFeatureById, isUniqueConstraintError, updateFeature } from '@/lib/data-access'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const feature = await getFeatureById(id)
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
    const feature = await updateFeature(id, { name, code, description, applicationId })
    return NextResponse.json(feature)
  } catch (error: unknown) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: '该应用下功能编码已存在' }, { status: 400 })
    }
    return NextResponse.json({ error: '更新功能失败' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await deleteFeature(id)
    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    return NextResponse.json({ error: '删除功能失败' }, { status: 500 })
  }
}
