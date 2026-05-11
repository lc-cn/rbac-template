'use client'

import Link from 'next/link'
import { ShieldAlert, X } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useI18n } from '@/i18n/context'
import {
  MFA_STATUS_UPDATED_EVENT,
  type MfaStatusUpdatedDetail,
} from '@/lib/mfa-status-broadcast'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const STORAGE_PREFIX = 'rbac:mfaEncourageBannerDismissed:'

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`
}

export function MfaEncouragementBanner() {
  const { t } = useI18n()
  const { data: session, status } = useSession()
  const [mfaEnabled, setMfaEnabled] = useState<boolean | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const fetchSeq = useRef(0)

  const userId = session?.user?.id
  const role = session?.tenantRole
  const eligible = role === 'owner' || role === 'admin'

  const refetchMfa = useCallback(async () => {
    if (status !== 'authenticated' || !eligible) {
      setMfaEnabled(null)
      return
    }
    const id = ++fetchSeq.current
    try {
      const res = await fetch('/api/security/mfa/status')
      const data = (await res.json()) as { mfaEnabled?: boolean }
      if (id !== fetchSeq.current) return
      if (typeof data.mfaEnabled === 'boolean') setMfaEnabled(data.mfaEnabled)
      else setMfaEnabled(null)
    } catch {
      if (id === fetchSeq.current) setMfaEnabled(null)
    }
  }, [status, eligible])

  useEffect(() => {
    if (!userId) {
      queueMicrotask(() => setDismissed(false))
      return
    }
    try {
      const v = localStorage.getItem(storageKey(userId)) === '1'
      queueMicrotask(() => setDismissed(v))
    } catch {
      queueMicrotask(() => setDismissed(false))
    }
  }, [userId])

  useEffect(() => {
    queueMicrotask(() => {
      if (status !== 'authenticated' || !eligible || dismissed) {
        setMfaEnabled(null)
        return
      }
      setMfaEnabled(null)
      void refetchMfa()
    })
  }, [status, eligible, dismissed, userId, refetchMfa])

  useEffect(() => {
    const onDetail = (e: Event) => {
      const ce = e as CustomEvent<MfaStatusUpdatedDetail>
      if (typeof ce.detail?.mfaEnabled === 'boolean') setMfaEnabled(ce.detail.mfaEnabled)
    }
    window.addEventListener(MFA_STATUS_UPDATED_EVENT, onDetail as EventListener)
    return () => window.removeEventListener(MFA_STATUS_UPDATED_EVENT, onDetail as EventListener)
  }, [])

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible' && eligible && !dismissed && status === 'authenticated') {
        void refetchMfa()
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [eligible, dismissed, refetchMfa, status])

  function onDismiss() {
    if (!userId) return
    try {
      localStorage.setItem(storageKey(userId), '1')
    } catch {
      /* ignore */
    }
    setDismissed(true)
  }

  if (status !== 'authenticated' || session?.mfaPending || !eligible || dismissed) {
    return null
  }
  if (mfaEnabled !== false) return null

  return (
    <div
      role="region"
      aria-label={t('mfaBanner.ariaLabel')}
      className={cn(
        'flex shrink-0 items-start gap-2 border-b border-amber-500/25 bg-amber-500/[0.08] px-3 py-2 sm:items-center sm:gap-3 sm:px-4',
        'dark:border-amber-400/20 dark:bg-amber-400/[0.07]'
      )}
    >
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300 sm:mt-0" aria-hidden />
      <p className="min-w-0 flex-1 text-xs leading-snug text-amber-950 dark:text-amber-50 sm:text-sm">
        {t('mfaBanner.body')}
      </p>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <Button type="button" variant="secondary" size="sm" className="h-8 text-xs sm:text-sm" asChild>
          <Link href="/profile?tab=security">{t('mfaBanner.cta')}</Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-amber-900 hover:bg-amber-500/15 dark:text-amber-100 dark:hover:bg-amber-400/10"
          onClick={onDismiss}
          aria-label={t('mfaBanner.dismissAria')}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
