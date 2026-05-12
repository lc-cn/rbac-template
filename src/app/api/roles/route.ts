import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createRole, isUniqueConstraintError, listRoles } from '@/lib/data-access'
import { PermissionCodes } from '@/lib/permission-codes'
import { guardTenantRbac } from '@/lib/rbac-server'
import { requireTenantId } from '@/lib/tenant-server'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const tenantRes = requireTenantId(session)
    if (tenantRes instanceof Response) return tenantRes
    const rbac = await guardTenantRbac(session, tenantRes, PermissionCodes.ROLE_READ, request)
    if (rbac) return rbac
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const roles = await listRoles(tenantRes, search)
    return NextResponse.json(roles)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: '获取角色列表失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const tenantRes = requireTenantId(session)
    if (tenantRes instanceof Response) return tenantRes
    const rbac = await guardTenantRbac(session, tenantRes, PermissionCodes.ROLE_CREATE, request)
    if (rbac) return rbac
    const body = await request.json()
    const { name, description, permissionIds } = body
    const role = await createRole({
      tenantId: tenantRes,
      name,
      description,
      permissionIds,
    })
    return NextResponse.json(role, { status: 201 })
  } catch (error: unknown) {
    console.error(error)
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: '角色名已存在' }, { status: 400 })
    }
    return NextResponse.json({ error: '创建角色失败' }, { status: 500 })
  }
}
