import { NextRequest, NextResponse } from 'next/server'
import { deleteOAuthProvider, getOAuthProviderById, isUniqueConstraintError, updateOAuthProvider } from '@/lib/data-access'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const provider = await getOAuthProviderById(id)
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
    const provider = await updateOAuthProvider(id, { name, type, clientId, clientSecret, enabled })
    return NextResponse.json(provider)
  } catch (error: unknown) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: '提供商名称已存在' }, { status: 400 })
    }
    return NextResponse.json({ error: '更新OAuth提供商失败' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await deleteOAuthProvider(id)
    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    return NextResponse.json({ error: '删除OAuth提供商失败' }, { status: 500 })
  }
}
