import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { listTenantsPlatformOverview } from '@/lib/data-access'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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
          只读跨租户列表。业务数据写入请先在顶栏进入目标租户。
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>租户</CardTitle>
          <CardDescription>成员数与应用数为当前库内聚合，仅供运维与支持查阅。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="w-full text-sm">
              <thead className="border-b border-border/60 bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">名称</th>
                  <th className="px-4 py-3 text-left font-medium">slug</th>
                  <th className="px-4 py-3 text-right font-medium">成员</th>
                  <th className="px-4 py-3 text-right font-medium">应用</th>
                  <th className="px-4 py-3 text-left font-medium">创建时间</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border/40 last:border-0">
                    <td className="px-4 py-3 font-medium">{r.name}</td>
                    <td className="px-4 py-3 font-mono text-xs">{r.slug}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.memberCount}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.applicationCount}</td>
                    <td className="text-muted-foreground px-4 py-3 text-xs">{r.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
