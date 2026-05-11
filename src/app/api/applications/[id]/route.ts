import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { deleteApplication, getApplicationById, isUniqueConstraintError, updateApplication } from '@/lib/data-access'
import { PermissionCodes } from '@/lib/permission-codes'
import { guardTenantRbac } from '@/lib/rbac-server'
import { requireTenantId } from '@/lib/tenant-server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const tenantRes = requireTenantId(session)
    if (tenantRes instanceof NextResponse) return tenantRes
    const rbac = await guardTenantRbac(session, tenantRes, PermissionCodes.APPLICATION_READ)
    if (rbac) return rbac
    const { id } = await params
    const app = await getApplicationById(id, tenantRes)
    if (!app) return NextResponse.json({ error: '应用不存在' }, { status: 404 })
    return NextResponse.json(app)
  } catch (error) {
    return NextResponse.json({ error: '获取应用失败' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const tenantRes = requireTenantId(session)
    if (tenantRes instanceof NextResponse) return tenantRes
    const rbac = await guardTenantRbac(session, tenantRes, PermissionCodes.APPLICATION_UPDATE)
    if (rbac) return rbac
    const { id } = await params
    const body = await request.json()
    const { name, code, description, status } = body
    const app = await updateApplication(id, tenantRes, { name, code, description, status })
    if (!app) return NextResponse.json({ error: '应用不存在' }, { status: 404 })
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
    const session = await auth()
    const tenantRes = requireTenantId(session)
    if (tenantRes instanceof NextResponse) return tenantRes
    const rbac = await guardTenantRbac(session, tenantRes, PermissionCodes.APPLICATION_DELETE)
    if (rbac) return rbac
    const { id } = await params
    await deleteApplication(id, tenantRes)
    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    return NextResponse.json({ error: '删除应用失败' }, { status: 500 })
  }
}
