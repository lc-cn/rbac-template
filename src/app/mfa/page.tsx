'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getCsrfToken, signOut } from 'next-auth/react'
import { startAuthentication } from '@simplewebauthn/browser'
import type { AuthenticationResponseJSON } from '@simplewebauthn/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useI18n } from '@/i18n/context'

export default function MfaPage() {
  const { t } = useI18n()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/'

  const [csrf, setCsrf] = useState<string | null>(null)
  const [totp, setTotp] = useState('')
  const [backup, setBackup] = useState('')
  const [busy, setBusy] = useState(false)

  const loadCsrf = useCallback(async () => {
    const tok = await getCsrfToken()
    setCsrf(tok ?? null)
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      void loadCsrf()
    })
  }, [loadCsrf])

  async function submitTotp(e: React.FormEvent) {
    e.preventDefault()
    if (!csrf) return
    setBusy(true)
    try {
      const res = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csrfToken: csrf, kind: 'totp', totp }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: t('common.error'), description: data.error ?? t('mfa.verifyFail'), variant: 'destructive' })
        return
      }
      router.replace(callbackUrl)
    } finally {
      setBusy(false)
    }
  }

  async function submitBackup(e: React.FormEvent) {
    e.preventDefault()
    if (!csrf) return
    setBusy(true)
    try {
      const res = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csrfToken: csrf, kind: 'backup', backupCode: backup }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: t('common.error'), description: data.error ?? t('mfa.verifyFail'), variant: 'destructive' })
        return
      }
      router.replace(callbackUrl)
    } finally {
      setBusy(false)
    }
  }

  async function passkeyMfa() {
    if (!csrf) return
    setBusy(true)
    try {
      const optRes = await fetch('/api/auth/mfa/webauthn-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csrfToken: csrf }),
      })
      const optData = await optRes.json()
      if (!optRes.ok) {
        toast({ title: t('common.error'), description: optData.error ?? t('mfa.passkeyFail'), variant: 'destructive' })
        return
      }
      const credential = (await startAuthentication({
        optionsJSON: optData.options,
      })) as AuthenticationResponseJSON

      const res = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csrfToken: csrf,
          kind: 'passkey',
          passkey: { challengeId: optData.challengeId, credential },
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: t('common.error'), description: data.error ?? t('mfa.verifyFail'), variant: 'destructive' })
        return
      }
      router.replace(callbackUrl)
    } catch {
      toast({ title: t('common.error'), description: t('mfa.passkeyFail'), variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-center text-2xl font-semibold tracking-tight">{t('mfa.title')}</h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">{t('mfa.subtitle')}</p>

      <div className="mt-8 space-y-8 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <form onSubmit={submitTotp} className="space-y-3">
          <Label htmlFor="mfa-totp">{t('mfa.totpLabel')}</Label>
          <Input
            id="mfa-totp"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={totp}
            onChange={(e) => setTotp(e.target.value)}
            placeholder="000000"
          />
          <Button type="submit" className="w-full" disabled={busy || !csrf}>
            {t('mfa.verifyTotp')}
          </Button>
        </form>

        <div className="border-t border-border pt-6">
          <form onSubmit={submitBackup} className="space-y-3">
            <Label htmlFor="mfa-backup">{t('mfa.backupLabel')}</Label>
            <Input
              id="mfa-backup"
              value={backup}
              onChange={(e) => setBackup(e.target.value)}
              autoComplete="off"
              placeholder={t('mfa.backupPlaceholder')}
            />
            <Button type="submit" variant="secondary" className="w-full" disabled={busy || !csrf}>
              {t('mfa.verifyBackup')}
            </Button>
          </form>
        </div>

        <div className="border-t border-border pt-6">
          <Button type="button" variant="outline" className="w-full" disabled={busy || !csrf} onClick={() => void passkeyMfa()}>
            {t('mfa.usePasskey')}
          </Button>
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-6">
          <Button
            type="button"
            variant="link"
            className="h-auto w-full text-muted-foreground"
            disabled={busy || !csrf}
            onClick={async () => {
              if (!csrf) return
              setBusy(true)
              try {
                const res = await fetch('/api/auth/mfa/recovery/request', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ csrfToken: csrf }),
                })
                const data = await res.json()
                if (!res.ok) {
                  toast({ title: t('common.error'), description: data.error ?? t('recover.fail'), variant: 'destructive' })
                  return
                }
                toast({ title: t('common.success'), description: data.message ?? t('mfa.recoveryRequested') })
              } finally {
                setBusy(false)
              }
            }}
          >
            {t('mfa.requestRecovery')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={() => void signOut({ callbackUrl: '/login' })}
          >
            {t('mfa.signOut')}
          </Button>
        </div>
      </div>
    </div>
  )
}
