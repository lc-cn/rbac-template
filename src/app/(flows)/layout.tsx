import type { ReactNode } from 'react'

/**
 * 独立流程页（无控制台 AppShell）：OAuth 同意等。
 * URL 不受括号分组影响，例如仍为 `/oauth/consent`。
 */
export default function FlowsLayout({ children }: { children: ReactNode }) {
  return children
}
