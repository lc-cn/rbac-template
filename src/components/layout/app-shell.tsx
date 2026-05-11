'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { SidebarNav } from '@/components/layout/sidebar-nav'
import { AppNavbar } from '@/components/layout/app-navbar'
import { useSidebarCollapsed } from '@/hooks/use-sidebar-collapsed'

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const pathname = usePathname()
  const { effectiveCollapsed, toggleCollapsed } = useSidebarCollapsed()

  useEffect(() => {
    setMobileNavOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!mobileNavOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileNavOpen])

  return (
    <div className="flex h-dvh max-h-dvh min-h-0 min-w-0 overflow-hidden bg-transparent">
      <Sidebar collapsed={effectiveCollapsed} onToggleCollapsed={toggleCollapsed} />

      {mobileNavOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-[hsl(var(--overlay)/0.35)] backdrop-blur-sm md:hidden dark:bg-[hsl(var(--overlay)/0.5)]"
            aria-label="backdrop"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside
            className="fixed left-0 top-0 z-50 flex h-[100dvh] max-h-[100dvh] min-h-0 w-[min(20rem,88vw)] max-w-full flex-col overflow-hidden border-r border-border/40 bg-card shadow-float ring-1 ring-black/[0.04] dark:ring-white/10 md:hidden"
            role="dialog"
            aria-modal="true"
          >
            <SidebarNav
              showCloseButton
              onClose={() => setMobileNavOpen(false)}
              onLinkClick={() => setMobileNavOpen(false)}
            />
          </aside>
        </>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AppNavbar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto scroll-smooth overscroll-y-contain [scrollbar-gutter:stable]">
          {children}
        </main>
      </div>
    </div>
  )
}
