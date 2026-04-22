import { NextRequest, NextResponse } from 'next/server'
import { createApplication, isUniqueConstraintError, listApplications } from '@/lib/data-access'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const apps = await listApplications(search)
    return NextResponse.json(apps)
  } catch (error) {
    return NextResponse.json({ error: '获取应用列表失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, code, description, status } = body
    const app = await createApplication({ name, code, description, status })
    return NextResponse.json(app, { status: 201 })
  } catch (error: unknown) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: '应用名或编码已存在' }, { status: 400 })
    }
    return NextResponse.json({ error: '创建应用失败' }, { status: 500 })
  }
}
