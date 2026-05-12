'use client'

import { cn } from '@/lib/utils'
import { SidebarNav } from '@/components/layout/sidebar-nav'

type SidebarProps = {
  collapsed: boolean
  onToggleCollapsed: () => void
}

/** 桌面端固定侧栏；移动端由 AppShell 内抽屉承载 */
export function Sidebar({ collapsed, onToggleCollapsed }: SidebarProps) {
  return (
    <aside
      className={cn(
        'hidden h-full min-h-0 max-h-full shrink-0 flex-col overflow-hidden border-r border-indigo-200/25 bg-gradient-to-b from-card via-card to-indigo-50/[0.18] text-card-foreground shadow-[6px_0_36px_-14px_rgb(49_46_129/0.12)] transition-[width] duration-200 ease-out dark:border-indigo-500/10 dark:from-card dark:via-card dark:to-violet-950/25 dark:shadow-[4px_0_32px_-8px_rgb(0_0_0/0.45)] md:flex',
        collapsed ? 'w-[4.5rem]' : 'w-64'
      )}
    >
      <SidebarNav collapsed={collapsed} onToggleCollapse={onToggleCollapsed} />
    </aside>
  )
}
