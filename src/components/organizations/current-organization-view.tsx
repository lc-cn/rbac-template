'use client'

import Link from 'next/link'
import { Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useI18n } from '@/i18n/context'
import type { TenantLifecycleDisplay } from '@/lib/tenant-lifecycle-display'
import { CurrentOrganizationMembersSection } from '@/components/organizations/current-organization-members-section'

type Props = {
  name: string
  slug: string
  lifecycle: TenantLifecycleDisplay
  currentUserId: string
}

function lifecycleMessageKey(l: TenantLifecycleDisplay): string {
  if (l === 'archived') return 'organizationsCurrent.lifecycleArchived'
  if (l === 'suspended') return 'organizationsCurrent.lifecycleSuspended'
  return 'organizationsCurrent.lifecycleActive'
}

export function CurrentOrganizationView({
  name,
  slug,
  lifecycle,
  currentUserId,
}: Props) {
  const { t } = useI18n()

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">← {t('organizationsCurrent.backHome')}</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="size-5 shrink-0" aria-hidden />
            <CardTitle className="text-xl">{t('organizationsCurrent.title')}</CardTitle>
          </div>
          <CardDescription>{t('organizationsCurrent.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <dl className="grid gap-3 sm:grid-cols-[8rem_1fr] sm:gap-x-4">
            <dt className="text-muted-foreground">{t('organizationsCurrent.fieldName')}</dt>
            <dd className="font-medium text-foreground">{name}</dd>
            <dt className="text-muted-foreground">{t('organizationsCurrent.fieldSlug')}</dt>
            <dd>
              <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">
                {slug}
              </code>
            </dd>
            <dt className="text-muted-foreground">{t('organizationsCurrent.fieldLifecycle')}</dt>
            <dd className="font-medium text-foreground">{t(lifecycleMessageKey(lifecycle))}</dd>
          </dl>
        </CardContent>
      </Card>
      <CurrentOrganizationMembersSection currentUserId={currentUserId} />
    </div>
  )
}
