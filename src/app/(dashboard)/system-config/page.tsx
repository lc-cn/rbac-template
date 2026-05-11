'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useI18n } from '@/i18n/context'
import { PageShell, PageHeader } from '@/components/layout/page-shell'
import { Save } from 'lucide-react'

interface SystemConfig {
  id: string
  key: string
  value: string
  group: string
  label?: string
}

export default function SystemConfigPage() {
  const { t } = useI18n()
  const [generalForm, setGeneralForm] = useState<Record<string, string>>({})
  const { toast } = useToast()

  const fetchData = useCallback(async () => {
    try {
      const configsRes = await fetch('/api/system-config')
      const configsData: SystemConfig[] = await configsRes.json()
      const generalConfigs = configsData.filter((c) => c.group === 'general')
      const form: Record<string, string> = {}
      generalConfigs.forEach((c) => {
        form[c.key] = c.value
      })
      setGeneralForm(form)
    } catch {
      toast({ title: t('common.error'), description: t('systemConfig.loadFail'), variant: 'destructive' })
    }
  }, [toast, t])

  useEffect(() => {
    queueMicrotask(() => {
      void fetchData()
    })
  }, [fetchData])

  const saveGeneralConfig = async () => {
    try {
      const configItems = [
        { key: 'site_name', value: generalForm['site_name'] || '', group: 'general', label: t('systemConfig.labelSiteName') },
        { key: 'site_url', value: generalForm['site_url'] || '', group: 'general', label: t('systemConfig.labelSiteUrl') },
        { key: 'admin_email', value: generalForm['admin_email'] || '', group: 'general', label: t('systemConfig.labelAdminEmail') },
        { key: 'session_timeout', value: generalForm['session_timeout'] || '3600', group: 'general', label: t('systemConfig.labelSessionTimeout') },
      ]
      const res = await fetch('/api/system-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs: configItems }),
      })
      if (!res.ok) throw new Error(t('systemConfig.saveFail'))
      toast({ title: t('common.success'), description: t('systemConfig.saved') })
      fetchData()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      toast({ title: t('common.error'), description: message, variant: 'destructive' })
    }
  }

  return (
    <PageShell density="comfortable">
      <PageHeader title={t('systemConfig.title')} description={t('systemConfig.subtitle')} />

      <Card>
        <CardHeader>
          <CardTitle>{t('systemConfig.generalTitle')}</CardTitle>
          <CardDescription>{t('systemConfig.generalDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="app-form-stack">
          <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
            <div className="app-form-field">
              <Label>{t('systemConfig.siteName')}</Label>
              <Input
                value={generalForm['site_name'] || ''}
                onChange={(e) => setGeneralForm((p) => ({ ...p, site_name: e.target.value }))}
                placeholder={t('systemConfig.placeholderSite')}
              />
            </div>
            <div className="app-form-field">
              <Label>{t('systemConfig.siteUrl')}</Label>
              <Input
                value={generalForm['site_url'] || ''}
                onChange={(e) => setGeneralForm((p) => ({ ...p, site_url: e.target.value }))}
                placeholder="https://example.com"
              />
            </div>
            <div className="app-form-field">
              <Label>{t('systemConfig.adminEmail')}</Label>
              <Input
                value={generalForm['admin_email'] || ''}
                onChange={(e) => setGeneralForm((p) => ({ ...p, admin_email: e.target.value }))}
                placeholder="admin@example.com"
              />
            </div>
            <div className="app-form-field">
              <Label>{t('systemConfig.sessionTimeout')}</Label>
              <Input
                value={generalForm['session_timeout'] || '3600'}
                onChange={(e) => setGeneralForm((p) => ({ ...p, session_timeout: e.target.value }))}
                placeholder="3600"
              />
            </div>
          </div>
          <Button type="button" className="mt-1 self-start sm:mt-2" onClick={saveGeneralConfig}>
            <Save className="mr-2 h-4 w-4" />
            {t('systemConfig.saveConfig')}
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  )
}
