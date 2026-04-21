'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { zh } from './messages/zh'
import { en } from './messages/en'
import type { Messages } from './messages/zh'

const dictionaries: Record<Locale, Messages> = { zh, en }

export type Locale = 'zh' | 'en'

type I18nContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (path: string, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

function getByPath(obj: unknown, path: string): string {
  const v = path.split('.').reduce<unknown>((o, key) => {
    if (o !== null && typeof o === 'object' && key in o) {
      return (o as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
  return typeof v === 'string' ? v : path
}

const STORAGE_KEY = 'rbac-locale'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('zh')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const s = localStorage.getItem(STORAGE_KEY) as Locale | null
      if (s === 'en' || s === 'zh') setLocaleState(s)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en'
  }, [locale, mounted])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  const dict = dictionaries[locale]

  const t = useMemo(
    () => (path: string, vars?: Record<string, string | number>) => {
      let s = getByPath(dict, path)
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          s = s.replaceAll(`{{${k}}}`, String(v))
        }
      }
      return s
    },
    [dict]
  )

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
