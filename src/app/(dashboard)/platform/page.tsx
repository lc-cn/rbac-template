import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { listTenantsPlatformOverview } from '@/lib/data-access'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PlatformTenantsTable } from './platform-tenants-table'

export const dynamic = 'force-dynamic'

export default async function PlatformOverviewPage() {
  const session = await auth()
  if (!session?.isPlatformAdmin) {
    redirect('/')
  }
  const rows = await listTenantsPlatformOverview()

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">平台运维总览</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          跨租户列表与生命周期运维（暂停 / 解除暂停 / 归档）。其他业务数据写入请先在顶栏进入目标租户。
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>租户</CardTitle>
          <CardDescription>成员数与应用数为当前库内聚合；生命周期变更经确认后生效。</CardDescription>
        </CardHeader>
        <CardContent>
          <PlatformTenantsTable rows={rows} />
        </CardContent>
      </Card>
    </div>
  )
}
