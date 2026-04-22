import { NextRequest, NextResponse } from 'next/server'
import { createFeature, isUniqueConstraintError, listFeatures } from '@/lib/data-access'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const applicationId = searchParams.get('applicationId') || ''
    const features = await listFeatures(search, applicationId)
    return NextResponse.json(features)
  } catch (error) {
    return NextResponse.json({ error: '获取功能列表失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, code, description, applicationId } = body
    const feature = await createFeature({ name, code, description, applicationId })
    return NextResponse.json(feature, { status: 201 })
  } catch (error: unknown) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: '该应用下功能编码已存在' }, { status: 400 })
    }
    return NextResponse.json({ error: '创建功能失败' }, { status: 500 })
  }
}
