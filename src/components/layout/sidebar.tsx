'use client'

import { SidebarNav } from '@/components/layout/sidebar-nav'

/** 桌面端固定侧栏；移动端由 AppShell 内抽屉承载 */
export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border/30 bg-card text-card-foreground shadow-[6px_0_32px_-12px_rgb(15_23_42/0.08)] dark:border-border/40 dark:shadow-[4px_0_28px_-6px_rgb(0_0_0/0.35)] md:flex">
      <SidebarNav />
    </aside>
  )
}
