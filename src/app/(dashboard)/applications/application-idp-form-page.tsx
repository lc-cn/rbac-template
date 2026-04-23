'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useI18n } from '@/i18n/context'
import { PageShell, PageHeader } from '@/components/layout/page-shell'
import {
  defaultFormState,
  formStateFromDto,
  scopesFromForm,
  type OAuth2ClientDto,
  type OAuth2ClientFormState,
} from './oauth-idp-types'

const SECRET_FLASH_KEY = 'oauth2_client_secret_flash'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 border-b border-border/50 pb-6 last:border-0 last:pb-0">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {children}
    </div>
  )
}

function FieldHint({ text }: { text: string }) {
  return <p className="text-xs leading-relaxed text-muted-foreground">{text}</p>
}

export function ApplicationIdpFormPage({
  applicationId,
  mode,
  initialRow,
}: {
  applicationId: string
  mode: 'create' | 'edit'
  initialRow?: OAuth2ClientDto | null
}) {
  const { t } = useI18n()
  const { toast } = useToast()
  const router = useRouter()
  const [form, setForm] = useState<OAuth2ClientFormState>(() =>
    mode === 'edit' && initialRow ? formStateFromDto(initialRow) : defaultFormState()
  )
  const [flashSecret, setFlashSecret] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (mode !== 'edit' || !initialRow?.id) return
    try {
      const raw = sessionStorage.getItem(SECRET_FLASH_KEY)
      if (!raw) return
      const o = JSON.parse(raw) as { id?: string; secret?: string }
      if (o.id === initialRow.id && typeof o.secret === 'string' && o.secret) {
        setFlashSecret(o.secret)
      }
    } catch {
      /* ignore */
    } finally {
      sessionStorage.removeItem(SECRET_FLASH_KEY)
    }
  }, [mode, initialRow?.id])

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
    setBusy(true)
    try {
      const base = buildPayload()
      if (mode === 'edit' && initialRow) {
        const res = await fetch(`/api/applications/${applicationId}/oauth`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...base,
            clientSecret: form.clientSecret.trim() || undefined,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'fail')
        toast({ title: t('common.success'), description: t('oauth2Clients.updated') })
        if (data.clientSecret) {
          setFlashSecret(String(data.clientSecret))
          setForm((p) => ({ ...p, clientSecret: '', regenerateSecret: false }))
        } else {
          router.push('/applications')
        }
      } else {
        const res = await fetch(`/api/applications/${applicationId}/oauth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(base),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'fail')
        toast({ title: t('common.success'), description: t('oauth2Clients.created') })
        const secret = data.clientSecret ? String(data.clientSecret) : null
        if (secret) {
          sessionStorage.setItem(SECRET_FLASH_KEY, JSON.stringify({ id: applicationId, secret }))
          router.replace(`/applications/${applicationId}/idp`)
        } else {
          router.push('/applications')
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      toast({ title: t('common.error'), description: message, variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  const showSecretBanner = Boolean(flashSecret)

  return (
    <PageShell>
      <PageHeader
        title={mode === 'create' ? t('applications.idpCreateTitle') : t('applications.idpEditTitle')}
        description={
          mode === 'edit' && initialRow
            ? `${initialRow.clientId} · ${initialRow.name}`
            : t('applications.idpSubtitle')
        }
        actions={
          <Button asChild variant="outline" className="w-full shrink-0 sm:w-auto">
            <Link href="/applications">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('applications.idpBackToList')}
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-6 pt-6">
          {showSecretBanner ? (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
              <p className="font-medium text-foreground">{t('oauth2Clients.secretOnce')}</p>
              <p className="mt-2 break-all font-mono text-xs">{flashSecret}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (flashSecret) void navigator.clipboard.writeText(flashSecret)
                    toast({ title: t('common.success'), description: t('oauth2Clients.copied') })
                  }}
                >
                  {t('oauth2Clients.copySecret')}
                </Button>
                <Button type="button" size="sm" onClick={() => setFlashSecret(null)}>
                  {t('oauth2Clients.savedSecretContinue')}
                </Button>
              </div>
            </div>
          ) : null}

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
                disabled={mode === 'edit'}
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
                rows={5}
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
                rows={4}
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
                  <Label
                    htmlFor="scOff"
                    className={`cursor-pointer text-sm ${!form.grantRefreshToken ? 'text-muted-foreground' : ''}`}
                  >
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
            {form.confidential && mode === 'create' ? (
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
            {form.confidential && mode === 'edit' ? (
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
        </CardContent>
        <CardFooter className="flex flex-wrap justify-end gap-2 border-t border-border/60 bg-muted/20 px-6 py-4">
          <Button type="button" variant="outline" disabled={busy} onClick={() => router.push('/applications')}>
            {t('common.cancel')}
          </Button>
          <Button type="button" onClick={() => void handleSubmit()} disabled={busy || showSecretBanner}>
            {t('common.save')}
          </Button>
        </CardFooter>
      </Card>
    </PageShell>
  )
}
