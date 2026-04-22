'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useI18n } from '@/i18n/context'
import { PageShell, PageHeader, CardToolbar } from '@/components/layout/page-shell'
import { Plus, Pencil, Trash2 } from 'lucide-react'

type OAuth2ClientRow = {
  id: string
  clientId: string
  name: string
  redirectUris: string[]
  allowedScopes: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export default function OAuth2ClientsPage() {
  const { t, locale } = useI18n()
  const [rows, setRows] = useState<OAuth2ClientRow[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editRow, setEditRow] = useState<OAuth2ClientRow | null>(null)
  const [form, setForm] = useState({
    name: '',
    clientId: '',
    redirectLines: '',
    allowedScopes: 'openid profile email offline_access',
    confidential: true,
    clientSecret: '',
    regenerateSecret: false,
  })
  const [lastPlainSecret, setLastPlainSecret] = useState<string | null>(null)
  const { toast } = useToast()
  const dateLocale = locale === 'zh' ? 'zh-CN' : 'en-US'

  const fetchRows = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/oauth2-clients')
      setRows(await res.json())
    } catch {
      toast({ title: t('common.error'), description: t('oauth2Clients.fetchFail'), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast, t])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/oauth2-clients')
        const data = await res.json()
        if (!cancelled) setRows(data)
      } catch {
        if (!cancelled) {
          toast({ title: t('common.error'), description: t('oauth2Clients.fetchFail'), variant: 'destructive' })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [t, toast])

  const openCreate = () => {
    setEditRow(null)
    setLastPlainSecret(null)
    setForm({
      name: '',
      clientId: '',
      redirectLines: 'http://localhost:5173/oauth/callback',
      allowedScopes: 'openid profile email offline_access',
      confidential: true,
      clientSecret: '',
      regenerateSecret: false,
    })
    setDialogOpen(true)
  }

  const openEdit = (row: OAuth2ClientRow) => {
    setEditRow(row)
    setLastPlainSecret(null)
    setForm({
      name: row.name,
      clientId: row.clientId,
      redirectLines: row.redirectUris.join('\n'),
      allowedScopes: row.allowedScopes,
      confidential: !row.isPublic,
      clientSecret: '',
      regenerateSecret: false,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    const redirectUris = form.redirectLines
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    try {
      let returnedSecret: string | null = null
      if (editRow) {
        const res = await fetch(`/api/oauth2-clients/${editRow.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            redirectUris,
            allowedScopes: form.allowedScopes,
            confidential: form.confidential,
            clientSecret: form.clientSecret.trim() || undefined,
            regenerateSecret: form.regenerateSecret,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'fail')
        if (data.clientSecret) returnedSecret = String(data.clientSecret)
        toast({ title: t('common.success'), description: t('oauth2Clients.updated') })
      } else {
        const res = await fetch('/api/oauth2-clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            clientId: form.clientId.trim() || undefined,
            redirectUris,
            allowedScopes: form.allowedScopes,
            confidential: form.confidential,
            clientSecret: form.confidential && form.clientSecret.trim() ? form.clientSecret.trim() : undefined,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'fail')
        if (data.clientSecret) returnedSecret = String(data.clientSecret)
        toast({ title: t('common.success'), description: t('oauth2Clients.created') })
      }
      void fetchRows()
      if (returnedSecret) {
        setLastPlainSecret(returnedSecret)
      } else {
        setLastPlainSecret(null)
        setDialogOpen(false)
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      toast({ title: t('common.error'), description: message, variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/oauth2-clients/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(t('oauth2Clients.deleteFail'))
      toast({ title: t('common.success'), description: t('oauth2Clients.deleted') })
      void fetchRows()
    } catch {
      toast({ title: t('common.error'), description: t('oauth2Clients.deleteFail'), variant: 'destructive' })
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <PageShell>
      <PageHeader
        title={t('oauth2Clients.title')}
        description={t('oauth2Clients.subtitle')}
        actions={
          <Button className="w-full shrink-0 sm:w-auto" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t('oauth2Clients.create')}
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardToolbar>
            <Button variant="outline" onClick={() => void fetchRows()}>
              {t('common.search')}
            </Button>
          </CardToolbar>
        </CardHeader>
        <CardContent>
          <div className="app-data-table overflow-x-auto">
            <table className="w-full min-w-[44rem] text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="app-table-head">{t('oauth2Clients.colName')}</th>
                  <th className="app-table-head">{t('oauth2Clients.colClientId')}</th>
                  <th className="app-table-head">{t('oauth2Clients.colType')}</th>
                  <th className="app-table-head">{t('oauth2Clients.colScopes')}</th>
                  <th className="app-table-head">{t('common.createdAt')}</th>
                  <th className="app-table-head app-table-head-end">{t('common.operation')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      {t('common.loading')}
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      {t('common.empty')}
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className="border-b border-border hover:bg-muted/50">
                      <td className="app-table-cell font-medium">{row.name}</td>
                      <td className="app-table-cell font-mono text-xs text-muted-foreground">{row.clientId}</td>
                      <td className="app-table-cell">
                        <Badge variant={row.isPublic ? 'secondary' : 'default'}>
                          {row.isPublic ? t('oauth2Clients.typePublic') : t('oauth2Clients.typeConfidential')}
                        </Badge>
                      </td>
                      <td className="app-table-cell max-w-[12rem] truncate text-muted-foreground" title={row.allowedScopes}>
                        {row.allowedScopes}
                      </td>
                      <td className="app-table-cell text-muted-foreground">
                        {new Date(row.createdAt).toLocaleDateString(dateLocale)}
                      </td>
                      <td className="app-table-cell app-table-cell-end">
                        <div className="app-row-actions">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteId(row.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editRow ? t('oauth2Clients.editTitle') : t('oauth2Clients.createTitle')}</DialogTitle>
          </DialogHeader>
          <div className="app-dialog-body max-h-[70vh] space-y-4 overflow-y-auto">
            {lastPlainSecret ? (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                <p className="font-medium text-foreground">{t('oauth2Clients.secretOnce')}</p>
                <p className="mt-2 break-all font-mono text-xs">{lastPlainSecret}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    void navigator.clipboard.writeText(lastPlainSecret)
                    toast({ title: t('common.success'), description: t('oauth2Clients.copied') })
                  }}
                >
                  {t('oauth2Clients.copySecret')}
                </Button>
              </div>
            ) : null}
            <div className="app-form-field">
              <Label>{t('oauth2Clients.colName')}</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="app-form-field">
              <Label>{t('oauth2Clients.colClientId')}</Label>
              <Input
                value={form.clientId}
                onChange={(e) => setForm((p) => ({ ...p, clientId: e.target.value }))}
                disabled={!!editRow}
                placeholder={t('oauth2Clients.clientIdPlaceholder')}
              />
            </div>
            <div className="app-form-field">
              <Label>{t('oauth2Clients.redirectUris')}</Label>
              <Textarea
                value={form.redirectLines}
                onChange={(e) => setForm((p) => ({ ...p, redirectLines: e.target.value }))}
                rows={4}
                placeholder="https://app.example.com/callback"
              />
            </div>
            <div className="app-form-field">
              <Label>{t('oauth2Clients.allowedScopes')}</Label>
              <Input
                value={form.allowedScopes}
                onChange={(e) => setForm((p) => ({ ...p, allowedScopes: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="oauthConf"
                checked={form.confidential}
                onCheckedChange={(v) => setForm((p) => ({ ...p, confidential: !!v }))}
              />
              <Label htmlFor="oauthConf" className="inline cursor-pointer">
                {t('oauth2Clients.confidential')}
              </Label>
            </div>
            {form.confidential && !editRow ? (
              <div className="app-form-field">
                <Label>{t('oauth2Clients.optionalSecret')}</Label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={form.clientSecret}
                  onChange={(e) => setForm((p) => ({ ...p, clientSecret: e.target.value }))}
                  placeholder={t('oauth2Clients.secretPlaceholder')}
                />
              </div>
            ) : null}
            {form.confidential && editRow ? (
              <>
                <div className="app-form-field">
                  <Label>{t('oauth2Clients.newSecretOptional')}</Label>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    value={form.clientSecret}
                    onChange={(e) => setForm((p) => ({ ...p, clientSecret: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="oauthRegen"
                    checked={form.regenerateSecret}
                    onCheckedChange={(v) => setForm((p) => ({ ...p, regenerateSecret: !!v }))}
                  />
                  <Label htmlFor="oauthRegen" className="inline cursor-pointer">
                    {t('oauth2Clients.regenerateSecret')}
                  </Label>
                </div>
              </>
            ) : null}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setLastPlainSecret(null)
                setDialogOpen(false)
              }}
            >
              {lastPlainSecret ? t('oauth2Clients.dismiss') : t('common.cancel')}
            </Button>
            {!lastPlainSecret ? (
              <Button onClick={() => void handleSubmit()}>{t('common.save')}</Button>
            ) : (
              <Button
                onClick={() => {
                  setLastPlainSecret(null)
                  setDialogOpen(false)
                }}
              >
                {t('oauth2Clients.savedSecretContinue')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('oauth2Clients.deleteConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDelete()} className="bg-red-600 hover:bg-red-700">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  )
}
