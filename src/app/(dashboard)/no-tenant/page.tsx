'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { CreateOrganizationForm } from '@/components/tenant/create-organization-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/** 已登录但未加入任何租户（且非平台管理员）时的引导页 */
export default function NoTenantPage() {
  const { data: session } = useSession()

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>尚未加入组织</CardTitle>
          <CardDescription>
            当前账号未关联任何租户。若已开放自助建组织，可填写下方表单创建；否则请等待管理员邀请。
            {session?.user?.email ? (
              <span className="mt-2 block font-mono text-xs">{session.user.email}</span>
            ) : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <CreateOrganizationForm />
          <div className="flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row sm:gap-3">
            <Button variant="outline" asChild>
              <Link href="/login">重新登录</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
