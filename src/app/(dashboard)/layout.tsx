import type { ReactNode } from 'react'
import { AppShell } from '@/components/layout/app-shell'

/** 管理后台：侧栏 + 顶栏；与 `(docs)`、`/login` 等互不嵌套 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>
}
