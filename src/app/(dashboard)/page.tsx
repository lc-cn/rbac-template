import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { dashboardCounts, getTenantDisplay } from '@/lib/data-access'
import { DashboardView } from '@/components/dashboard/dashboard-view'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await auth()
  const tid = session?.currentTenantId
  if (!tid) {
    if (session?.isPlatformAdmin) redirect('/platform')
    redirect('/no-tenant')
  }
  const { userCount, roleCount, permissionCount, appCount } = await dashboardCounts(tid)
  const tenantDisplay = await getTenantDisplay(tid)

  return (
    <DashboardView
      tenantName={tenantDisplay?.name ?? ''}
      tenantSlug={tenantDisplay?.slug ?? ''}
      userCount={userCount}
      roleCount={roleCount}
      permissionCount={permissionCount}
      appCount={appCount}
    />
  )
}
