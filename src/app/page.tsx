import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Shield, Key, AppWindow } from 'lucide-react'

export default async function DashboardPage() {
  const [userCount, roleCount, permissionCount, appCount] = await Promise.all([
    prisma.user.count(),
    prisma.role.count(),
    prisma.permission.count(),
    prisma.application.count(),
  ])

  const stats = [
    { title: '用户总数', value: userCount, icon: Users, color: 'text-blue-600' },
    { title: '角色总数', value: roleCount, icon: Shield, color: 'text-green-600' },
    { title: '权限总数', value: permissionCount, icon: Key, color: 'text-purple-600' },
    { title: '应用总数', value: appCount, icon: AppWindow, color: 'text-orange-600' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">控制台</h1>
        <p className="text-gray-500 mt-1">RBAC 权限管理系统概览</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
