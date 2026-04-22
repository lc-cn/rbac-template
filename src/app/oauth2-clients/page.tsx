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
  postLogoutRedirectUris: string[]
  allowedScopes: string
  isPublic: boolean
  logoUrl: string | null
  clientUri: string | null
  policyUri: string | null
  tosUri: string | null
  jwksUri: string | null
  grantAuthorizationCode: boolean
  grantRefreshToken: boolean
  accessTokenTtlSeconds: number
  refreshTokenTtlDays: number
  authorizationCodeTtlMinutes: number
  createdAt: string
  updatedAt: string
}

type FormState = {
  name: string
  clientId: string
  redirectLines: string
  postLogoutLines: string
  scopeProfile: boolean
  scopeEmail: boolean
  scopeOffline: boolean
  grantRefreshToken: boolean
  accessTokenTtlSeconds: number
  refreshTokenTtlDays: number
  authorizationCodeTtlMinutes: number
  logoUrl: string
  clientUri: string
  policyUri: string
  tosUri: string
  jwksUri: string
  confidential: boolean
  clientSecret: string
  regenerateSecret: boolean
}

function scopesFromForm(f: FormState): string {
  const parts = ['openid']
  if (f.scopeProfile) parts.push('profile')
  if (f.scopeEmail) parts.push('email')
  if (f.scopeOffline) parts.push('offline_access')
  return parts.join(' ')
}

function formFromRow(row: OAuth2ClientRow): FormState {
  const s = new Set((row.allowedScopes || '').split(/\s+/).filter(Boolean))
  const redirects = Array.isArray(row.redirectUris) ? row.redirectUris : []
  const postLogout = Array.isArray(row.postLogoutRedirectUris) ? row.postLogoutRedirectUris : []
  return {
    name: row.name,
    clientId: row.clientId,
    redirectLines: redirects.join('\n'),
    postLogoutLines: postLogout.join('\n'),
    scopeProfile: s.has('profile'),
    scopeEmail: s.has('email'),
    scopeOffline: s.has('offline_access'),
    grantRefreshToken: row.grantRefreshToken !== false,
    accessTokenTtlSeconds: Number(row.accessTokenTtlSeconds) || 3600,
    refreshTokenTtlDays: Number(row.refreshTokenTtlDays) || 30,
    authorizationCodeTtlMinutes: Number(row.authorizationCodeTtlMinutes) || 10,
    logoUrl: row.logoUrl ?? '',
    clientUri: row.clientUri ?? '',
    policyUri: row.policyUri ?? '',
    tosUri: row.tosUri ?? '',
    jwksUri: row.jwksUri ?? '',
    confidential: !row.isPublic,
    clientSecret: '',
    regenerateSecret: false,
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 border-b border-border/50 pb-4 last:border-0 last:pb-0">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {children}
    </div>
  )
}

function FieldHint({ text }: { text: string }) {
  return <p className="text-xs leading-relaxed text-muted-foreground">{text}</p>
}

export default function OAuth2ClientsPage() {
  const { t, locale } = useI18n()
  const [rows, setRows] = useState<OAuth2ClientRow[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editRow, setEditRow] = useState<OAuth2ClientRow | null>(null)
  const [form, setForm] = useState<FormState>(() => ({
    name: '',
    clientId: '',
    redirectLines: 'http://localhost:5173/oauth/callback',
    postLogoutLines: '',
    scopeProfile: true,
    scopeEmail: true,
    scopeOffline: true,
    grantRefreshToken: true,
    accessTokenTtlSeconds: 3600,
    refreshTokenTtlDays: 30,
    authorizationCodeTtlMinutes: 10,
    logoUrl: '',
    clientUri: '',
    policyUri: '',
    tosUri: '',
    jwksUri: '',
    confidential: true,
    clientSecret: '',
    regenerateSecret: false,
  }))
  const [lastPlainSecret, setLastPlainSecret] = useState<string | null>(null)
  const { toast } = useToast()
  const dateLocale = locale === 'zh' ? 'zh-CN' : 'en-US'

  const fetchRows = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/oauth2-clients')
      const data = (await res.json()) as OAuth2ClientRow[]
      setRows(Array.isArray(data) ? data : [])
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
        if (!cancelled) setRows(Array.isArray(data) ? data : [])
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
      postLogoutLines: '',
      scopeProfile: true,
      scopeEmail: true,
      scopeOffline: true,
      grantRefreshToken: true,
      accessTokenTtlSeconds: 3600,
      refreshTokenTtlDays: 30,
      authorizationCodeTtlMinutes: 10,
      logoUrl: '',
      clientUri: '',
      policyUri: '',
      tosUri: '',
      jwksUri: '',
      confidential: true,
      clientSecret: '',
      regenerateSecret: false,
    })
    setDialogOpen(true)
  }

  const openEdit = (row: OAuth2ClientRow) => {
    setEditRow(row)
    setLastPlainSecret(null)
    setForm(formFromRow(row))
    setDialogOpen(true)
  }

  const buildPayload = () => {
    const redirectUris = form.redirectLines
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    const postLogoutRedirectUris = form.postLogoutLines
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    const allowedScopes = scopesFromForm(form)
    return {
      name: form.name,
      clientId: form.clientId.trim() || undefined,
      redirectUris,
      postLogoutRedirectUris,
      allowedScopes,
      confidential: form.confidential,
      clientSecret: form.confidential && form.clientSecret.trim() ? form.clientSecret.trim() : undefined,
      regenerateSecret: form.regenerateSecret,
      logoUrl: form.logoUrl.trim() || null,
      clientUri: form.clientUri.trim() || null,
      policyUri: form.policyUri.trim() || null,
      tosUri: form.tosUri.trim() || null,
      jwksUri: form.jwksUri.trim() || null,
      grantRefreshToken: form.grantRefreshToken,
      accessTokenTtlSeconds: form.accessTokenTtlSeconds,
      refreshTokenTtlDays: form.refreshTokenTtlDays,
      authorizationCodeTtlMinutes: form.authorizationCodeTtlMinutes,
    }
  }

  const handleSubmit = async () => {
    if (form.scopeOffline && !form.grantRefreshToken) {
      toast({
        title: t('common.error'),
        description: t('oauth2Clients.errOfflineNeedsRefresh'),
        variant: 'destructive',
      })
      return
    }
    try {
      let returnedSecret: string | null = null
      const base = buildPayload()
      if (editRow) {
        const res = await fetch(`/api/oauth2-clients/${editRow.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...base,
            clientSecret: form.clientSecret.trim() || undefined,
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
          body: JSON.stringify(base),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'fail')
        if (data.clientSecret) returnedSecret = String(data.clientSecret)
        toast({ title: t('common.success'), description: t('oauth2Clients.created') })
      }
      void fetchRows()
      if (returnedSecret) setLastPlainSecret(returnedSecret)
      else {
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
            <table className="w-full min-w-[52rem] text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="app-table-head">{t('oauth2Clients.colName')}</th>
                  <th className="app-table-head">{t('oauth2Clients.colClientId')}</th>
                  <th className="app-table-head">{t('oauth2Clients.colType')}</th>
                  <th className="app-table-head">{t('oauth2Clients.colScopes')}</th>
                  <th className="app-table-head">{t('oauth2Clients.colToken')}</th>
                  <th className="app-table-head">{t('common.createdAt')}</th>
                  <th className="app-table-head app-table-head-end">{t('common.operation')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      {t('common.loading')}
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      {t('common.empty')}
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className="border-b border-border hover:bg-muted/50">
                      <td className="app-table-cell">
                        <div className="flex min-w-0 items-center gap-2.5">
                          {row.logoUrl ? (
                            <img
                              src={row.logoUrl}
                              alt=""
                              className="h-9 w-9 shrink-0 rounded-lg border border-border/60 bg-muted object-cover"
                            />
                          ) : (
                            <div className="h-9 w-9 shrink-0 rounded-lg bg-muted ring-1 ring-border/60" />
                          )}
                          <span className="min-w-0 truncate font-medium">{row.name}</span>
                        </div>
                      </td>
                      <td className="app-table-cell font-mono text-xs text-muted-foreground">{row.clientId}</td>
                      <td className="app-table-cell">
                        <Badge variant={row.isPublic ? 'secondary' : 'default'}>
                          {row.isPublic ? t('oauth2Clients.typePublic') : t('oauth2Clients.typeConfidential')}
                        </Badge>
                      </td>
                      <td className="app-table-cell max-w-[10rem]">
                        <div className="flex flex-wrap gap-1">
                          {(row.allowedScopes || '')
                            .split(/\s+/)
                            .filter(Boolean)
                            .map((s) => (
                            <Badge key={s} variant="outline" className="font-normal">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td
                        className="app-table-cell whitespace-nowrap font-mono text-xs text-muted-foreground"
                        title={`access / refresh / code`}
                      >
                        {row.accessTokenTtlSeconds}s / {row.refreshTokenTtlDays}d / {row.authorizationCodeTtlMinutes}m
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
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editRow ? t('oauth2Clients.editTitle') : t('oauth2Clients.createTitle')}</DialogTitle>
          </DialogHeader>
          <div className="app-dialog-body space-y-5 pr-1">
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
            ) : (
              <>
                <Section title={t('oauth2Clients.sectionBasic')}>
                  <div className="app-form-field">
                    <Label>{t('oauth2Clients.colName')}</Label>
                    <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                    <FieldHint text={t('oauth2Clients.hintName')} />
                  </div>
                  <div className="app-form-field">
                    <Label>{t('oauth2Clients.colClientId')}</Label>
                    <Input
                      value={form.clientId}
                      onChange={(e) => setForm((p) => ({ ...p, clientId: e.target.value }))}
                      disabled={!!editRow}
                      placeholder={t('oauth2Clients.clientIdPlaceholder')}
                    />
                    <FieldHint text={t('oauth2Clients.hintClientId')} />
                  </div>
                </Section>

                <Section title={t('oauth2Clients.sectionBranding')}>
                  <div className="app-form-field">
                    <Label>{t('oauth2Clients.logoUrl')}</Label>
                    <Input
                      value={form.logoUrl}
                      onChange={(e) => setForm((p) => ({ ...p, logoUrl: e.target.value }))}
                      placeholder="https://"
                    />
                    <FieldHint text={t('oauth2Clients.hintLogo')} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="app-form-field">
                      <Label>{t('oauth2Clients.clientUri')}</Label>
                      <Input
                        value={form.clientUri}
                        onChange={(e) => setForm((p) => ({ ...p, clientUri: e.target.value }))}
                        placeholder="https://"
                      />
                    </div>
                    <div className="app-form-field">
                      <Label>{t('oauth2Clients.policyUri')}</Label>
                      <Input
                        value={form.policyUri}
                        onChange={(e) => setForm((p) => ({ ...p, policyUri: e.target.value }))}
                        placeholder="https://"
                      />
                    </div>
                    <div className="app-form-field sm:col-span-2">
                      <Label>{t('oauth2Clients.tosUri')}</Label>
                      <Input
                        value={form.tosUri}
                        onChange={(e) => setForm((p) => ({ ...p, tosUri: e.target.value }))}
                        placeholder="https://"
                      />
                    </div>
                  </div>
                </Section>

                <Section title={t('oauth2Clients.sectionCallbacks')}>
                  <div className="app-form-field">
                    <Label>{t('oauth2Clients.redirectUris')}</Label>
                    <Textarea
                      value={form.redirectLines}
                      onChange={(e) => setForm((p) => ({ ...p, redirectLines: e.target.value }))}
                      rows={4}
                      className="font-mono text-xs"
                      placeholder="https://app.example.com/oauth/callback"
                    />
                    <FieldHint text={t('oauth2Clients.hintRedirect')} />
                  </div>
                  <div className="app-form-field">
                    <Label>{t('oauth2Clients.postLogoutUris')}</Label>
                    <Textarea
                      value={form.postLogoutLines}
                      onChange={(e) => setForm((p) => ({ ...p, postLogoutLines: e.target.value }))}
                      rows={3}
                      className="font-mono text-xs"
                      placeholder="https://app.example.com/"
                    />
                    <FieldHint text={t('oauth2Clients.hintPostLogout')} />
                  </div>
                </Section>

                <Section title={t('oauth2Clients.sectionSecurity')}>
                  <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2.5">
                    <Checkbox
                      id="grantRef"
                      checked={form.grantRefreshToken}
                      onCheckedChange={(v) =>
                        setForm((p) => ({
                          ...p,
                          grantRefreshToken: !!v,
                          scopeOffline: !!v ? p.scopeOffline : false,
                        }))
                      }
                    />
                    <div className="min-w-0">
                      <Label htmlFor="grantRef" className="cursor-pointer font-medium">
                        {t('oauth2Clients.grantRefresh')}
                      </Label>
                      <FieldHint text={t('oauth2Clients.hintGrantRefresh')} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('oauth2Clients.hintScopes')}</Label>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-lg border border-border/60 bg-card px-3 py-3">
                      <div className="flex items-center gap-2 opacity-80">
                        <Checkbox id="scOidc" checked disabled />
                        <Label htmlFor="scOidc" className="cursor-default text-sm">
                          {t('oauth2Clients.scopeOpenid')}
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="scProf"
                          checked={form.scopeProfile}
                          onCheckedChange={(v) => setForm((p) => ({ ...p, scopeProfile: !!v }))}
                        />
                        <Label htmlFor="scProf" className="cursor-pointer text-sm">
                          {t('oauth2Clients.scopeProfile')}
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="scMail"
                          checked={form.scopeEmail}
                          onCheckedChange={(v) => setForm((p) => ({ ...p, scopeEmail: !!v }))}
                        />
                        <Label htmlFor="scMail" className="cursor-pointer text-sm">
                          {t('oauth2Clients.scopeEmail')}
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="scOff"
                          checked={form.scopeOffline}
                          disabled={!form.grantRefreshToken}
                          onCheckedChange={(v) => {
                            const on = !!v
                            setForm((p) => ({
                              ...p,
                              scopeOffline: on,
                              grantRefreshToken: on ? true : p.grantRefreshToken,
                            }))
                          }}
                        />
                        <Label htmlFor="scOff" className={`cursor-pointer text-sm ${!form.grantRefreshToken ? 'text-muted-foreground' : ''}`}>
                          {t('oauth2Clients.scopeOffline')}
                        </Label>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="app-form-field">
                      <Label>{t('oauth2Clients.accessTokenTtl')}</Label>
                      <Input
                        type="number"
                        min={300}
                        max={86400}
                        value={form.accessTokenTtlSeconds}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, accessTokenTtlSeconds: Number(e.target.value) || 3600 }))
                        }
                      />
                      <FieldHint text={t('oauth2Clients.hintAccessTtl')} />
                    </div>
                    <div className="app-form-field">
                      <Label>{t('oauth2Clients.refreshTokenTtl')}</Label>
                      <Input
                        type="number"
                        min={1}
                        max={365}
                        value={form.refreshTokenTtlDays}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, refreshTokenTtlDays: Number(e.target.value) || 30 }))
                        }
                      />
                      <FieldHint text={t('oauth2Clients.hintRefreshTtl')} />
                    </div>
                    <div className="app-form-field">
                      <Label>{t('oauth2Clients.authCodeTtl')}</Label>
                      <Input
                        type="number"
                        min={1}
                        max={60}
                        value={form.authorizationCodeTtlMinutes}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            authorizationCodeTtlMinutes: Number(e.target.value) || 10,
                          }))
                        }
                      />
                      <FieldHint text={t('oauth2Clients.hintCodeTtl')} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
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
                </Section>

                <Section title={t('oauth2Clients.sectionAdvanced')}>
                  <div className="app-form-field">
                    <Label>{t('oauth2Clients.jwksUri')}</Label>
                    <Input
                      value={form.jwksUri}
                      onChange={(e) => setForm((p) => ({ ...p, jwksUri: e.target.value }))}
                      placeholder="https://rp.example.com/.well-known/jwks.json"
                      className="font-mono text-xs"
                    />
                    <FieldHint text={t('oauth2Clients.hintJwks')} />
                  </div>
                </Section>
              </>
            )}
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
