'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useI18n } from '@/i18n/context'
import { PageShell, PageHeader, CardToolbar } from '@/components/layout/page-shell'
import { Plus, Pencil, Trash2, Save } from 'lucide-react'

interface SystemConfig {
  id: string
  key: string
  value: string
  group: string
  label?: string
}

interface OAuthProvider {
  id: string
  name: string
  type: string
  clientId: string
  clientSecret: string
  enabled: boolean
}

const OAUTH_TYPES = ['github', 'wechat', 'google', 'dingtalk', 'feishu', 'custom']

export default function SystemConfigPage() {
  const { t } = useI18n()
  const [providers, setProviders] = useState<OAuthProvider[]>([])
  const [generalForm, setGeneralForm] = useState<Record<string, string>>({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editProvider, setEditProvider] = useState<OAuthProvider | null>(null)
  const [providerForm, setProviderForm] = useState({
    name: '', type: 'github', clientId: '', clientSecret: '', enabled: false,
  })
  const { toast } = useToast()

  const fetchData = useCallback(async () => {
    try {
      const [configsRes, providersRes] = await Promise.all([
        fetch('/api/system-config'),
        fetch('/api/oauth-providers'),
      ])
      const configsData: SystemConfig[] = await configsRes.json()
      const providersData: OAuthProvider[] = await providersRes.json()
      setProviders(providersData)

      const generalConfigs = configsData.filter(c => c.group === 'general')
      const form: Record<string, string> = {}
      generalConfigs.forEach(c => { form[c.key] = c.value })
      setGeneralForm(form)
    } catch {
      toast({ title: t('common.error'), description: t('systemConfig.loadFail'), variant: 'destructive' })
    }
  }, [toast, t])

  useEffect(() => { fetchData() }, [fetchData])

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

  const openCreateProvider = () => {
    setEditProvider(null)
    setProviderForm({ name: '', type: 'github', clientId: '', clientSecret: '', enabled: false })
    setDialogOpen(true)
  }

  const openEditProvider = (provider: OAuthProvider) => {
    setEditProvider(provider)
    setProviderForm({
      name: provider.name,
      type: provider.type,
      clientId: provider.clientId,
      clientSecret: provider.clientSecret,
      enabled: provider.enabled,
    })
    setDialogOpen(true)
  }

  const handleProviderSubmit = async () => {
    try {
      const url = editProvider ? `/api/oauth-providers/${editProvider.id}` : '/api/oauth-providers'
      const res = await fetch(url, {
        method: editProvider ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(providerForm),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast({
        title: t('common.success'),
        description: editProvider ? t('systemConfig.providerUpdated') : t('systemConfig.providerCreated'),
      })
      setDialogOpen(false)
      fetchData()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      toast({ title: t('common.error'), description: message, variant: 'destructive' })
    }
  }

  const handleDeleteProvider = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/oauth-providers/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(t('systemConfig.deleteFail'))
      toast({ title: t('common.success'), description: t('systemConfig.providerDeleted') })
      fetchData()
    } catch {
      toast({ title: t('common.error'), description: t('systemConfig.deleteFail'), variant: 'destructive' })
    } finally {
      setDeleteId(null)
    }
  }

  const toggleProvider = async (provider: OAuthProvider) => {
    try {
      const res = await fetch(`/api/oauth-providers/${provider.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...provider, enabled: !provider.enabled }),
      })
      if (!res.ok) throw new Error(t('systemConfig.updateFail'))
      fetchData()
    } catch {
      toast({ title: t('common.error'), description: t('systemConfig.updateFail'), variant: 'destructive' })
    }
  }

  return (
    <PageShell density="comfortable">
      <PageHeader title={t('systemConfig.title')} description={t('systemConfig.subtitle')} />

      <Tabs defaultValue="general" className="flex flex-col gap-6 sm:gap-8">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="general">{t('systemConfig.tabGeneral')}</TabsTrigger>
          <TabsTrigger value="oauth">{t('systemConfig.tabOAuth')}</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
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
                    onChange={e => setGeneralForm(p => ({ ...p, site_name: e.target.value }))}
                    placeholder={t('systemConfig.placeholderSite')}
                  />
                </div>
                <div className="app-form-field">
                  <Label>{t('systemConfig.siteUrl')}</Label>
                  <Input
                    value={generalForm['site_url'] || ''}
                    onChange={e => setGeneralForm(p => ({ ...p, site_url: e.target.value }))}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="app-form-field">
                  <Label>{t('systemConfig.adminEmail')}</Label>
                  <Input
                    value={generalForm['admin_email'] || ''}
                    onChange={e => setGeneralForm(p => ({ ...p, admin_email: e.target.value }))}
                    placeholder="admin@example.com"
                  />
                </div>
                <div className="app-form-field">
                  <Label>{t('systemConfig.sessionTimeout')}</Label>
                  <Input
                    value={generalForm['session_timeout'] || '3600'}
                    onChange={e => setGeneralForm(p => ({ ...p, session_timeout: e.target.value }))}
                    placeholder="3600"
                  />
                </div>
              </div>
              <Button className="mt-1 self-start sm:mt-2" onClick={saveGeneralConfig}>
                <Save className="mr-2 h-4 w-4" />{t('systemConfig.saveConfig')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="oauth">
          <Card>
            <CardHeader>
              <CardToolbar className="items-stretch sm:items-center">
                <div className="min-w-0 flex-1 space-y-1">
                  <CardTitle>{t('systemConfig.oauthTitle')}</CardTitle>
                  <CardDescription>{t('systemConfig.oauthDesc')}</CardDescription>
                </div>
                <Button className="w-full shrink-0 sm:w-auto" onClick={openCreateProvider}>
                  <Plus className="mr-2 h-4 w-4" />{t('systemConfig.addProvider')}
                </Button>
              </CardToolbar>
            </CardHeader>
            <CardContent>
              <div className="app-form-stack">
                {providers.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground sm:py-12">{t('systemConfig.noProviders')}</p>
                ) : providers.map(provider => (
                  <div key={provider.id} className="app-oauth-provider-row">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium break-all">{provider.name}</span>
                        <Badge variant="outline" className="shrink-0 capitalize">{provider.type}</Badge>
                        <Badge variant={provider.enabled ? 'default' : 'secondary'} className="shrink-0">
                          {provider.enabled ? t('common.enabled') : t('common.disabled')}
                        </Badge>
                      </div>
                      <p className="mt-1 break-all text-sm text-muted-foreground">
                        {t('systemConfig.clientIdPreview')}: {provider.clientId.substring(0, 8)}...
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center justify-start gap-2 sm:justify-end sm:gap-3">
                      <Switch
                        checked={provider.enabled}
                        onCheckedChange={() => toggleProvider(provider)}
                      />
                      <Button variant="ghost" size="sm" onClick={() => openEditProvider(provider)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(provider.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editProvider ? t('systemConfig.editProvider') : t('systemConfig.createProvider')}</DialogTitle></DialogHeader>
          <div className="app-dialog-body">
            <div className="app-form-field">
              <Label>{t('systemConfig.providerName')}</Label>
              <Input value={providerForm.name} onChange={e => setProviderForm(p => ({ ...p, name: e.target.value }))} placeholder="GitHub" />
            </div>
            <div className="app-form-field">
              <Label>{t('systemConfig.providerType')}</Label>
              <select
                className="app-native-select capitalize"
                value={providerForm.type}
                onChange={e => setProviderForm(p => ({ ...p, type: e.target.value }))}
              >
                {OAUTH_TYPES.map(opt => (
                  <option key={opt} value={opt} className="capitalize">{opt}</option>
                ))}
              </select>
            </div>
            <div className="app-form-field">
              <Label>{t('systemConfig.fieldClientId')}</Label>
              <Input value={providerForm.clientId} onChange={e => setProviderForm(p => ({ ...p, clientId: e.target.value }))} />
            </div>
            <div className="app-form-field">
              <Label>{t('systemConfig.fieldClientSecret')}</Label>
              <Input type="password" value={providerForm.clientSecret} onChange={e => setProviderForm(p => ({ ...p, clientSecret: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2 pt-0.5">
              <Switch
                id="providerEnabled"
                checked={providerForm.enabled}
                onCheckedChange={v => setProviderForm(p => ({ ...p, enabled: v }))}
              />
              <Label htmlFor="providerEnabled" className="inline cursor-pointer">{t('common.enabled')}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleProviderSubmit}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('systemConfig.deleteProviderConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProvider} className="bg-red-600 hover:bg-red-700">{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  )
}
