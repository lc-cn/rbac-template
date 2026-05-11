import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createApplication, isUniqueConstraintError, listApplications } from '@/lib/data-access'
import { PermissionCodes } from '@/lib/permission-codes'
import { guardTenantRbac } from '@/lib/rbac-server'
import { requireTenantId } from '@/lib/tenant-server'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const tenantRes = requireTenantId(session)
    if (tenantRes instanceof NextResponse) return tenantRes
    const rbac = await guardTenantRbac(session, tenantRes, PermissionCodes.APPLICATION_READ)
    if (rbac) return rbac
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const apps = await listApplications(tenantRes, search)
    return NextResponse.json(apps)
  } catch (error) {
    return NextResponse.json({ error: '获取应用列表失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const tenantRes = requireTenantId(session)
    if (tenantRes instanceof NextResponse) return tenantRes
    const rbac = await guardTenantRbac(session, tenantRes, PermissionCodes.APPLICATION_CREATE)
    if (rbac) return rbac
    const body = await request.json()
    const { name, code, description, status } = body
    const app = await createApplication({
      tenantId: tenantRes,
      name,
      code,
      description,
      status,
    })
    return NextResponse.json(app, { status: 201 })
  } catch (error: unknown) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: '应用名或编码已存在' }, { status: 400 })
    }
    return NextResponse.json({ error: '创建应用失败' }, { status: 500 })
  }
}
