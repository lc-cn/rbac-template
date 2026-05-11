'use client'

import { ThemeProvider } from 'next-themes'
import type { ReactNode } from 'react'
import { SessionProvider } from 'next-auth/react'
import { I18nProvider } from '@/i18n/context'
import { THEME_STORAGE_KEY } from '@/lib/theme-preference'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        storageKey={THEME_STORAGE_KEY}
        disableTransitionOnChange
      >
        <I18nProvider>{children}</I18nProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
