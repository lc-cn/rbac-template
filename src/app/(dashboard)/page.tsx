import { dashboardCounts } from '@/lib/data-access'
import { DashboardView } from '@/components/dashboard/dashboard-view'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const { userCount, roleCount, permissionCount, appCount } = await dashboardCounts()

  return (
    <DashboardView
      userCount={userCount}
      roleCount={roleCount}
      permissionCount={permissionCount}
      appCount={appCount}
    />
  )
}
