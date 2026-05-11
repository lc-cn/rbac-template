'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/i18n/context'

type TenantsApiResponse = {
  tenants?: { id: string; name: string; slug: string }[]
  allowSelfServiceCreate?: boolean
}

export function CreateOrganizationForm({
  className,
  onSuccessNavigateTo = '/',
}: {
  className?: string
  /** 创建并切换租户后的跳转路径 */
  onSuccessNavigateTo?: string
}) {
  const { t } = useI18n()
  const router = useRouter()
  const { update } = useSession()
  const [policyLoading, setPolicyLoading] = useState(true)
  const [allowCreate, setAllowCreate] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPolicy = useCallback(async () => {
    setPolicyLoading(true)
    setError(null)
    try {
      const r = await fetch('/api/tenants')
      const d = (await r.json()) as TenantsApiResponse
      setAllowCreate(d.allowSelfServiceCreate === true)
    } catch {
      setAllowCreate(false)
      setError(t('org.policyLoadError'))
    } finally {
      setPolicyLoading(false)
    }
  }, [t])

  useEffect(() => {
    void loadPolicy()
  }, [loadPolicy])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const trimmed = name.trim()
    if (!trimmed) {
      setError(t('org.nameRequired'))
      return
    }
    setSubmitting(true)
    try {
      const r = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmed,
          slug: slug.trim() || undefined,
        }),
      })
      const data = (await r.json()) as { error?: string; tenant?: { id: string } }
      if (!r.ok) {
        setError(data.error ?? t('org.createFail'))
        return
      }
      if (!data.tenant?.id) {
        setError(t('org.createMissingTenant'))
        return
      }
      await update({ currentTenantId: data.tenant.id })
      router.push(onSuccessNavigateTo)
      router.refresh()
    } catch {
      setError(t('org.networkError'))
    } finally {
      setSubmitting(false)
    }
  }

  if (policyLoading) {
    return (
      <div className={className}>
        <p className="text-sm text-muted-foreground">{t('org.loadingPolicy')}</p>
      </div>
    )
  }

  if (!allowCreate) {
    return (
      <div className={className} role="region" aria-label={t('org.selfServiceOffTitle')}>
        <p className="text-sm font-medium text-foreground">{t('org.selfServiceOffTitle')}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t('org.selfServiceOffBody')}</p>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          {t('org.selfServiceOffHint')}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className={className}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="org-name">{t('org.nameLabel')}</Label>
          <Input
            id="org-name"
            name="name"
            autoComplete="organization"
            placeholder={t('org.namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            disabled={submitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-slug">
            {t('org.slugLabel')} <span className="font-normal text-muted-foreground">{t('org.slugOptional')}</span>
          </Label>
          <Input
            id="org-slug"
            name="slug"
            autoComplete="off"
            placeholder={t('org.slugPlaceholder')}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            maxLength={63}
            disabled={submitting}
            className="font-mono text-sm"
          />
        </div>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
          {submitting ? t('org.submitting') : t('org.submit')}
        </Button>
      </div>
    </form>
  )
}
