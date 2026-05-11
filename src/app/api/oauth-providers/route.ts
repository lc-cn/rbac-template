import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createOAuthProvider, isUniqueConstraintError, listOAuthProviders } from '@/lib/data-access'
import { PermissionCodes } from '@/lib/permission-codes'
import { guardTenantRbac } from '@/lib/rbac-server'
import { requireTenantId } from '@/lib/tenant-server'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const tenantRes = requireTenantId(session)
    if (tenantRes instanceof NextResponse) return tenantRes
    const rbac = await guardTenantRbac(session, tenantRes, PermissionCodes.OAUTH_PROVIDER_READ, request)
    if (rbac) return rbac
    const providers = await listOAuthProviders()
    return NextResponse.json(providers)
  } catch (error) {
    return NextResponse.json({ error: '获取OAuth提供商失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const tenantRes = requireTenantId(session)
    if (tenantRes instanceof NextResponse) return tenantRes
    const rbac = await guardTenantRbac(session, tenantRes, PermissionCodes.OAUTH_PROVIDER_CREATE, request)
    if (rbac) return rbac
    const body = await request.json()
    const { name, type, clientId, clientSecret, enabled } = body
    const provider = await createOAuthProvider({
      name,
      type,
      clientId,
      clientSecret,
      enabled: enabled ?? false,
    })
    return NextResponse.json(provider, { status: 201 })
  } catch (error: unknown) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: '提供商名称已存在' }, { status: 400 })
    }
    return NextResponse.json({ error: '创建OAuth提供商失败' }, { status: 500 })
  }
}
