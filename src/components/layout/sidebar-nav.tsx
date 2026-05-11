'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/i18n/context'
import { Button } from '@/components/ui/button'
import {
  Users,
  Shield,
  Key,
  AppWindow,
  Layers,
  Settings,
  LayoutDashboard,
  CircleUser,
  Building2,
} from 'lucide-react'

const navItems = [
  { href: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { href: '/profile', labelKey: 'nav.profile', icon: CircleUser },
  { href: '/users', labelKey: 'nav.users', icon: Users },
  { href: '/roles', labelKey: 'nav.roles', icon: Shield },
  { href: '/permissions', labelKey: 'nav.permissions', icon: Key },
  { href: '/applications', labelKey: 'nav.applications', icon: AppWindow },
  { href: '/features', labelKey: 'nav.features', icon: Layers },
  { href: '/system-config', labelKey: 'nav.systemConfig', icon: Settings },
] as const

type SidebarNavProps = {
  /** 点击导航链接后回调（用于关闭移动端抽屉） */
  onLinkClick?: () => void
  showCloseButton?: boolean
  onClose?: () => void
}

export function SidebarNav({ onLinkClick, showCloseButton, onClose }: SidebarNavProps) {
  const pathname = usePathname()
  const { t } = useI18n()
  const { data: session } = useSession()

  const platformItem =
    session?.isPlatformAdmin === true
      ? [{ href: '/platform', labelKey: 'nav.platform', icon: Building2 } as const]
      : []

  const allNav = [...navItems, ...platformItem]

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      <div
        className={cn(
          'relative shrink-0 border-b border-border/40 px-3 pb-4 pt-3 sm:px-4 sm:pb-5 sm:pt-4',
          showCloseButton && 'pr-14'
        )}
      >
        {showCloseButton && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-3 h-9 w-9 shrink-0"
            onClick={onClose}
            aria-label={t('common.closeMenu')}
          >
            <X className="h-5 w-5" />
          </Button>
        )}
        <div className="rounded-2xl border border-border/60 bg-muted/60 px-4 py-4 shadow-sm">
          <h1 className="text-lg font-bold leading-tight tracking-tight text-foreground sm:text-xl">{t('nav.brand')}</h1>
          <p className="mt-1 text-xs leading-snug text-muted-foreground">{t('nav.tagline')}</p>
        </div>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-3 sm:px-3 sm:py-4">
        <ul className="space-y-1">
          {allNav.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => onLinkClick?.()}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium transition-colors duration-200',
                    isActive
                      ? 'border-foreground/15 bg-muted font-medium text-foreground shadow-sm'
                      : 'text-muted-foreground hover:border-border/60 hover:bg-muted/70 hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-90" />
                  <span className="min-w-0 break-words">{t(item.labelKey)}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      <div className="shrink-0 border-t border-border/40 px-3 py-3">
        <p className="text-center text-xs text-muted-foreground">{t('common.version')} 1.0.0</p>
      </div>
    </div>
  )
}
