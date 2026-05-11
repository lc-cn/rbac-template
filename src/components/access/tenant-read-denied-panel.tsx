'use client'

import { ShieldAlert } from 'lucide-react'
import { PageShell, PageHeader } from '@/components/layout/page-shell'
import { useI18n } from '@/i18n/context'

export function TenantReadDeniedPanel({ permissionCode }: { permissionCode: string }) {
  const { t } = useI18n()
  return (
    <PageShell density="comfortable">
      <PageHeader title={t('access.tenantReadDeniedTitle')} description={t('access.tenantReadDeniedBody')} />
      <div
        role="alert"
        aria-live="polite"
        className="mt-6 flex gap-4 rounded-2xl border border-border/60 bg-muted/40 p-5 ring-1 ring-black/[0.03] dark:bg-muted/25 dark:ring-white/10 sm:p-6"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-background text-amber-700 shadow-sm dark:text-amber-500">
          <ShieldAlert className="h-5 w-5" aria-hidden />
        </div>
        <p className="min-w-0 pt-1 text-sm leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">{t('access.tenantReadDeniedCodeLabel')}</span>{' '}
          <code className="break-all rounded-md border border-border/60 bg-muted/80 px-1.5 py-0.5 font-mono text-xs">
            {permissionCode}
          </code>
        </p>
      </div>
    </PageShell>
  )
}
