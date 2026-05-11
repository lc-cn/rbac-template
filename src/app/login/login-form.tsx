'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getCsrfToken, signIn } from 'next-auth/react'
import { startAuthentication } from '@simplewebauthn/browser'
import type { AuthenticationResponseJSON } from '@simplewebauthn/types'
import { BookOpen, ChevronRight, LayoutDashboard } from 'lucide-react'
import { useI18n } from '@/i18n/context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function mapErrorMessage(error: string | null, t: (k: string) => string): string | null {
  if (!error) return null
  if (error === 'CredentialsSignin') return t('login.errorCredentials')
  return t('login.errorGeneric')
}

export function LoginForm() {
  const { t } = useI18n()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/'
  const urlError = searchParams.get('error')

  const [mode, setMode] = useState<'password' | 'passkey'>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [credError, setCredError] = useState<string | null>(null)

  const urlAuthMessage = useMemo(() => mapErrorMessage(urlError, t), [urlError, t])

  const authBanner = credError ?? urlAuthMessage

  async function onCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setCredError(null)
    try {
      const res = await signIn('credentials', {
        email: email.trim(),
        password,
        callbackUrl,
        redirect: false,
      })
      if (res?.error) {
        setCredError(t('login.errorCredentials'))
        return
      }
      if (res?.url) {
        window.location.href = res.url
      }
    } finally {
      setBusy(false)
    }
  }

  async function onPasskeyLogin() {
    const em = email.trim()
    if (!em) {
      setCredError(t('login.errorCredentials'))
      return
    }
    setBusy(true)
    setCredError(null)
    try {
      const csrf = await getCsrfToken()
      if (!csrf) {
        setCredError(t('login.errorGeneric'))
        return
      }
      const optRes = await fetch('/api/auth/passkey/login-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: em, csrfToken: csrf }),
      })
      const optData = await optRes.json()
      if (!optRes.ok) {
        setCredError(optData.error ?? t('login.errorGeneric'))
        return
      }
      const credential = (await startAuthentication({
        optionsJSON: optData.options,
      })) as AuthenticationResponseJSON

      const verifyRes = await fetch('/api/auth/passkey/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csrfToken: csrf,
          challengeId: optData.challengeId,
          credential,
        }),
      })
      const verifyData = await verifyRes.json()
      if (!verifyRes.ok) {
        setCredError(verifyData.error ?? t('login.errorGeneric'))
        return
      }
      const next =
        verifyData.mfaPending === true
          ? `/mfa?callbackUrl=${encodeURIComponent(callbackUrl)}`
          : callbackUrl
      window.location.href = next
    } catch {
      setCredError(t('login.errorGeneric'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-md flex-col justify-center px-4 py-12 sm:py-16">
      <header className="mb-8 text-center sm:mb-10">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/85 text-primary-foreground shadow-lg shadow-primary/20 ring-1 ring-white/10 dark:ring-white/5">
          <LayoutDashboard className="h-8 w-8" aria-hidden />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{t('nav.brand')}</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{t('nav.tagline')}</p>
        <p className="mt-8 text-sm text-muted-foreground">{t('login.subtitle')}</p>
      </header>

      <div className="rounded-2xl border border-border/60 bg-card/95 p-6 shadow-xl shadow-black/[0.04] ring-1 ring-black/[0.04] backdrop-blur-sm dark:bg-card/90 dark:ring-white/[0.06] sm:p-7">
        <h2 className="mb-5 text-center text-base font-semibold tracking-tight text-foreground">{t('login.title')}</h2>
        <div className="mb-5 flex gap-2 rounded-xl bg-muted/50 p-1">
          <Button
            type="button"
            variant={mode === 'password' ? 'secondary' : 'ghost'}
            className="flex-1"
            onClick={() => {
              setMode('password')
              setCredError(null)
            }}
          >
            {t('login.modePassword')}
          </Button>
          <Button
            type="button"
            variant={mode === 'passkey' ? 'secondary' : 'ghost'}
            className="flex-1"
            onClick={() => {
              setMode('passkey')
              setCredError(null)
            }}
          >
            {t('login.modePasskey')}
          </Button>
        </div>
        {authBanner ? (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          >
            {authBanner}
          </div>
        ) : null}
        {mode === 'password' ? (
          <form onSubmit={onCredentialsSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">{t('login.email')}</Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setCredError(null)
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">{t('common.password')}</Label>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setCredError(null)
                }}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? t('login.signingIn') : t('login.signIn')}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email-pk">{t('login.email')}</Label>
              <Input
                id="login-email-pk"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setCredError(null)
                }}
              />
            </div>
            <Button type="button" className="w-full" disabled={busy} onClick={() => void onPasskeyLogin()}>
              {busy ? t('login.passkeyBusy') : t('login.passkeySignIn')}
            </Button>
          </div>
        )}
        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link href="/recover/mfa" className="underline underline-offset-2 hover:text-foreground">
            {t('login.recoveryLink')}
          </Link>
        </p>
      </div>

      <aside
        className="mt-8 rounded-2xl border border-border/60 bg-gradient-to-br from-muted/40 via-card to-muted/20 p-5 shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.05] sm:p-6"
        aria-label={t('login.docsCtaTitle')}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BookOpen className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">{t('login.docsCtaBadge')}</p>
            <h2 className="text-sm font-semibold leading-snug text-foreground">{t('login.docsCtaTitle')}</h2>
            <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">{t('login.docsCtaDesc')}</p>
            <Button variant="outline" size="sm" className="mt-1 h-9 gap-1 border-primary/25 text-primary hover:bg-primary/5" asChild>
              <Link href="/docs">
                {t('login.docsCtaLink')}
                <ChevronRight className="h-4 w-4 opacity-80" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </aside>
    </div>
  )
}
