'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, Moon, Sun, Monitor, User, LogOut, CircleUser, Building2, Check } from 'lucide-react'
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
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { locale, setLocale, t } = useI18n()
  const { data: session, status, update } = useSession()
  const [mounted, setMounted] = useState(false)
  const [tenants, setTenants] = useState<{ id: string; name: string; slug: string }[]>([])
  const [allowSelfServiceCreate, setAllowSelfServiceCreate] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (status !== 'authenticated') return
    let cancelled = false
    fetch('/api/tenants')
      .then((r) => r.json())
      .then((d: { tenants?: { id: string; name: string; slug: string }[]; allowSelfServiceCreate?: boolean }) => {
        if (!cancelled) {
          if (Array.isArray(d.tenants)) setTenants(d.tenants)
          setAllowSelfServiceCreate(d.allowSelfServiceCreate === true)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [status])

  const currentTenant = tenants.find((x) => x.id === session?.currentTenantId)
  const tenantLabel = currentTenant?.name ?? session?.currentTenantId ?? '—'

  async function switchTenant(tenantId: string) {
    await update({ currentTenantId: tenantId })
    router.refresh()
  }

  const showTenantMenu =
    status === 'authenticated' && session?.user && (tenants.length > 0 || allowSelfServiceCreate)

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
            {showTenantMenu ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 max-w-[11rem] shrink gap-1.5 px-2 font-normal sm:max-w-[14rem]"
                      aria-label={t('nav.tenantSwitcher')}
                    >
                      <Building2 className="h-3.5 w-3.5 shrink-0 opacity-80" />
                      <span className="truncate text-xs sm:text-sm">
                        {tenants.length === 0 ? t('nav.createOrganizationShort') : tenantLabel}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>{t('nav.tenantSwitcher')}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {tenants.map((ten) => (
                      <DropdownMenuItem
                        key={ten.id}
                        className="cursor-pointer gap-2"
                        onSelect={() => {
                          void switchTenant(ten.id)
                        }}
                      >
                        {session?.currentTenantId === ten.id ? (
                          <Check className="h-4 w-4 shrink-0 opacity-70" />
                        ) : (
                          <span className="inline-block w-4 shrink-0" aria-hidden />
                        )}
                        <span className="min-w-0 flex-1 truncate">{ten.name}</span>
                        <span className="text-muted-foreground shrink-0 font-mono text-[10px]">{ten.slug}</span>
                      </DropdownMenuItem>
                    ))}
                    {allowSelfServiceCreate ? (
                      <>
                        {tenants.length > 0 ? <DropdownMenuSeparator /> : null}
                        <DropdownMenuItem asChild className="cursor-pointer">
                          <Link href="/organizations/new" className="flex w-full items-center">
                            {t('nav.createOrganization')}
                          </Link>
                        </DropdownMenuItem>
                      </>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="mx-0.5 h-4 w-px shrink-0 bg-border" aria-hidden />
              </>
            ) : null}

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
