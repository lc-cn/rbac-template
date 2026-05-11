import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createTenantAsOwner, isUniqueConstraintError, listTenantsForUser } from '@/lib/data-access'
import { allowSelfServiceTenantCreate } from '@/lib/tenant-policy'
import { requireUserId } from '@/lib/tenant-server'

export async function GET() {
  try {
    const session = await auth()
    const uid = requireUserId(session)
    if (uid instanceof NextResponse) return uid
    const tenants = await listTenantsForUser(uid)
    return NextResponse.json({
      tenants,
      allowSelfServiceCreate: allowSelfServiceTenantCreate(),
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '获取租户列表失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!allowSelfServiceTenantCreate()) {
      return NextResponse.json({ error: '当前部署未开放自助创建租户' }, { status: 403 })
    }
    const session = await auth()
    const uid = requireUserId(session)
    if (uid instanceof NextResponse) return uid
    const body = (await request.json()) as { name?: unknown; slug?: unknown }
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (!name) return NextResponse.json({ error: '租户名称不能为空' }, { status: 400 })
    const slug = body.slug === null || body.slug === undefined ? null : typeof body.slug === 'string' ? body.slug : ''
    const tenant = await createTenantAsOwner({ name, slug: slug || null }, uid)
    return NextResponse.json({ tenant }, { status: 201 })
  } catch (e: unknown) {
    console.error(e)
    if (isUniqueConstraintError(e)) {
      return NextResponse.json({ error: 'slug 已存在，请更换' }, { status: 400 })
    }
    return NextResponse.json({ error: '创建租户失败' }, { status: 500 })
  }
}
