'use client'

import { ThemeProvider } from 'next-themes'
import type { ReactNode } from 'react'
import { SessionProvider } from 'next-auth/react'
import { I18nProvider } from '@/i18n/context'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <I18nProvider>{children}</I18nProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
