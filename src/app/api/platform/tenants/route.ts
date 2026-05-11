import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { listTenantsPlatformOverview } from '@/lib/data-access'
import { requirePlatformAdmin } from '@/lib/tenant-server'

/** 平台管理员：跨租户只读列表 */
export async function GET() {
  try {
    const session = await auth()
    const denied = requirePlatformAdmin(session)
    if (denied) return denied
    const rows = await listTenantsPlatformOverview()
    return NextResponse.json(rows)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '获取租户列表失败' }, { status: 500 })
  }
}
