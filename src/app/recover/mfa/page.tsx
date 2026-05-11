'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getCsrfToken } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useI18n } from '@/i18n/context'

export default function RecoverMfaPage() {
  const { t } = useI18n()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [csrf, setCsrf] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const loadCsrf = useCallback(async () => {
    const tok = await getCsrfToken()
    setCsrf(tok ?? null)
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      void loadCsrf()
    })
  }, [loadCsrf])

  async function onRequestRecovery(e: React.FormEvent) {
    e.preventDefault()
    if (!csrf) return
    setBusy(true)
    try {
      const res = await fetch('/api/auth/mfa/recovery/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csrfToken: csrf, email: email.trim(), password }),
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
  }

  async function onConfirm() {
    if (!csrf || !token) {
      toast({ title: t('common.error'), description: t('recover.missingToken'), variant: 'destructive' })
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/auth/mfa/recovery/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csrfToken: csrf, token }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: t('common.error'), description: data.error ?? t('recover.fail'), variant: 'destructive' })
        return
      }
      toast({
        title: t('common.success'),
        description: data.message ?? t('recover.done'),
      })
      router.replace('/login')
    } finally {
      setBusy(false)
    }
  }

  if (token) {
    return (
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col justify-center px-4 py-12">
        <h1 className="text-center text-2xl font-semibold tracking-tight">{t('recover.title')}</h1>
        <p className="mt-3 text-center text-sm leading-relaxed text-muted-foreground">{t('recover.warning')}</p>
        <Button className="mt-8 w-full" disabled={busy || !csrf || !token} onClick={() => void onConfirm()}>
          {t('recover.confirm')}
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-center text-2xl font-semibold tracking-tight">{t('recover.title')}</h1>
      <p className="mt-3 text-center text-sm leading-relaxed text-muted-foreground">{t('recover.requestIntro')}</p>
      <form onSubmit={onRequestRecovery} className="mt-8 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="rec-email">{t('login.email')}</Label>
          <Input id="rec-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rec-pw">{t('common.password')}</Label>
          <Input
            id="rec-pw"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={busy || !csrf}>
          {t('mfa.requestRecovery')}
        </Button>
      </form>
    </div>
  )
}
