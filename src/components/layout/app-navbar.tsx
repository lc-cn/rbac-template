'use client'

import Link from 'next/link'
import { Menu, Moon, Sun, Monitor, User, LogOut, CircleUser } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useI18n, type Locale } from '@/i18n/context'

const locales: Locale[] = ['zh', 'en']

type AppNavbarProps = {
  onOpenMobileNav?: () => void
}

export function AppNavbar({ onOpenMobileNav }: AppNavbarProps) {
  const { theme, setTheme } = useTheme()
  const { locale, setLocale, t } = useI18n()
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="flex h-12 w-full shrink-0 items-center gap-2 border-b border-border/40 bg-card/95 px-2 shadow-[0_1px_0_rgb(15_23_42/0.04)] backdrop-blur-md sm:gap-3 sm:px-4">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 md:hidden"
        onClick={onOpenMobileNav}
        aria-label={t('common.openMenu')}
      >
        <Menu className="h-4 w-4" />
      </Button>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-1 sm:gap-1.5">
        {!mounted ? (
          <div className="h-8 w-28 shrink-0 sm:w-32" aria-hidden />
        ) : (
          <>
            <div className="flex items-center rounded-lg border border-border/50 bg-muted/50 p-0.5 shadow-inner">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn('h-7 w-7', theme === 'light' && 'bg-background shadow-sm')}
                onClick={() => setTheme('light')}
                aria-pressed={theme === 'light'}
                title={t('common.themeLight')}
              >
                <Sun className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn('h-7 w-7', theme === 'dark' && 'bg-background shadow-sm')}
                onClick={() => setTheme('dark')}
                aria-pressed={theme === 'dark'}
                title={t('common.themeDark')}
              >
                <Moon className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn('h-7 w-7', theme === 'system' && 'bg-background shadow-sm')}
                onClick={() => setTheme('system')}
                aria-pressed={theme === 'system'}
                title={t('common.themeSystem')}
              >
                <Monitor className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="mx-0.5 h-4 w-px shrink-0 bg-border" aria-hidden />

            <div className="flex items-center rounded-lg border border-border/50 bg-muted/50 p-0.5 shadow-inner">
              {locales.map((code) => (
                <Button
                  key={code}
                  type="button"
                  variant="ghost"
                  className={cn(
                    'h-7 min-w-[1.75rem] px-1.5 text-xs font-medium sm:min-w-7 sm:px-2',
                    locale === code && 'bg-background shadow-sm'
                  )}
                  onClick={() => setLocale(code)}
                  aria-pressed={locale === code}
                  title={code === 'zh' ? t('common.localeZh') : t('common.localeEn')}
                >
                  {code === 'zh' ? '中' : 'EN'}
                </Button>
              ))}
            </div>

            {status === 'authenticated' && session?.user ? (
              <>
                <div className="mx-0.5 h-4 w-px shrink-0 bg-border" aria-hidden />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 rounded-full"
                      aria-label={t('nav.openUserMenu')}
                    >
                      <User className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        {session.user.name ? (
                          <p className="text-sm font-medium leading-none text-foreground">{session.user.name}</p>
                        ) : null}
                        {session.user.email ? (
                          <p className="truncate text-xs leading-snug text-muted-foreground">{session.user.email}</p>
                        ) : null}
                        {!session.user.name && !session.user.email ? (
                          <p className="text-sm text-muted-foreground">—</p>
                        ) : null}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="cursor-pointer gap-2">
                      <Link href="/profile" className="flex items-center gap-2">
                        <CircleUser className="h-4 w-4" />
                        {t('nav.profile')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                      onSelect={() => signOut({ callbackUrl: '/login' })}
                    >
                      <LogOut className="h-4 w-4" />
                      {t('common.signOut')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : null}
          </>
        )}
      </div>
    </header>
  )
}
