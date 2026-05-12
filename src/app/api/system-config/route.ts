import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { listSystemConfigs, upsertSystemConfigRow } from '@/lib/data-access'
import { PermissionCodes } from '@/lib/permission-codes'
import { guardTenantRbac } from '@/lib/rbac-server'
import { requireTenantId } from '@/lib/tenant-server'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const tenantRes = requireTenantId(session)
    if (tenantRes instanceof Response) return tenantRes
    const rbac = await guardTenantRbac(session, tenantRes, PermissionCodes.SYSTEM_CONFIG_READ, request)
    if (rbac) return rbac
    const configs = await listSystemConfigs()
    return NextResponse.json(configs)
  } catch {
    return NextResponse.json({ error: '获取系统配置失败' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    const tenantRes = requireTenantId(session)
    if (tenantRes instanceof Response) return tenantRes
    const rbac = await guardTenantRbac(session, tenantRes, PermissionCodes.SYSTEM_CONFIG_UPDATE, request)
    if (rbac) return rbac
    const body = await request.json()
    const { configs } = body
    const results = await Promise.all(
      configs.map(({ key, value, group, label }: { key: string; value: string; group: string; label: string }) =>
        upsertSystemConfigRow({ key, value, group, label })
      )
    )
    return NextResponse.json(results)
  } catch {
    return NextResponse.json({ error: '更新系统配置失败' }, { status: 500 })
  }
}
