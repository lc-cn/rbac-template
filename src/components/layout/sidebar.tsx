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
        'hidden h-full min-h-0 max-h-full shrink-0 flex-col overflow-hidden border-r border-border/30 bg-card text-card-foreground shadow-[6px_0_32px_-12px_rgb(15_23_42/0.08)] transition-[width] duration-200 ease-out dark:border-border/40 dark:shadow-[4px_0_28px_-6px_rgb(0_0_0/0.35)] md:flex',
        collapsed ? 'w-[4.5rem]' : 'w-64'
      )}
    >
      <SidebarNav collapsed={collapsed} onToggleCollapse={onToggleCollapsed} />
    </aside>
  )
}
