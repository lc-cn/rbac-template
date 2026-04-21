import { prisma } from '@/lib/prisma'
import { DashboardView } from '@/components/dashboard/dashboard-view'

export default async function DashboardPage() {
  const [userCount, roleCount, permissionCount, appCount] = await Promise.all([
    prisma.user.count(),
    prisma.role.count(),
    prisma.permission.count(),
    prisma.application.count(),
  ])

  return (
    <DashboardView
      userCount={userCount}
      roleCount={roleCount}
      permissionCount={permissionCount}
      appCount={appCount}
    />
  )
}
