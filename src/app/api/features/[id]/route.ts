import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { deleteFeature, getFeatureById, isUniqueConstraintError, updateFeature } from '@/lib/data-access'
import { PermissionCodes } from '@/lib/permission-codes'
import { guardTenantRbac } from '@/lib/rbac-server'
import { requireTenantId } from '@/lib/tenant-server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const tenantRes = requireTenantId(session)
    if (tenantRes instanceof Response) return tenantRes
    const rbac = await guardTenantRbac(session, tenantRes, PermissionCodes.FEATURE_READ, request)
    if (rbac) return rbac
    const { id } = await params
    const feature = await getFeatureById(id, tenantRes)
    if (!feature) return NextResponse.json({ error: '功能不存在' }, { status: 404 })
    return NextResponse.json(feature)
  } catch (error) {
    return NextResponse.json({ error: '获取功能失败' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const tenantRes = requireTenantId(session)
    if (tenantRes instanceof Response) return tenantRes
    const rbac = await guardTenantRbac(session, tenantRes, PermissionCodes.FEATURE_UPDATE, request)
    if (rbac) return rbac
    const { id } = await params
    const body = await request.json()
    const { name, code, description, applicationId } = body
    const feature = await updateFeature(id, tenantRes, { name, code, description, applicationId })
    if (!feature) return NextResponse.json({ error: '功能或应用无效' }, { status: 400 })
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
    const session = await auth()
    const tenantRes = requireTenantId(session)
    if (tenantRes instanceof Response) return tenantRes
    const rbac = await guardTenantRbac(session, tenantRes, PermissionCodes.FEATURE_DELETE, request)
    if (rbac) return rbac
    const { id } = await params
    await deleteFeature(id, tenantRes)
    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    return NextResponse.json({ error: '删除功能失败' }, { status: 500 })
  }
}
