import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createPermission, isUniqueConstraintError, listPermissions } from '@/lib/data-access'
import { PermissionCodes } from '@/lib/permission-codes'
import { guardTenantRbac } from '@/lib/rbac-server'
import { requireTenantId } from '@/lib/tenant-server'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const tenantRes = requireTenantId(session)
    if (tenantRes instanceof NextResponse) return tenantRes
    const rbac = await guardTenantRbac(session, tenantRes, PermissionCodes.PERM_READ)
    if (rbac) return rbac
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const featureId = searchParams.get('featureId') || ''
    const permissions = await listPermissions(tenantRes, search, featureId)
    return NextResponse.json(permissions)
  } catch (error) {
    return NextResponse.json({ error: '获取权限列表失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const tenantRes = requireTenantId(session)
    if (tenantRes instanceof NextResponse) return tenantRes
    const rbac = await guardTenantRbac(session, tenantRes, PermissionCodes.PERM_CREATE)
    if (rbac) return rbac
    const body = await request.json()
    const { name, code, description, featureId } = body
    const permission = await createPermission({
      tenantId: tenantRes,
      name,
      code,
      description,
      featureId,
    })
    if (!permission) return NextResponse.json({ error: '功能不存在或不属于当前租户' }, { status: 400 })
    return NextResponse.json(permission, { status: 201 })
  } catch (error: unknown) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: '该功能下权限编码已存在' }, { status: 400 })
    }
    return NextResponse.json({ error: '创建权限失败' }, { status: 500 })
  }
}
