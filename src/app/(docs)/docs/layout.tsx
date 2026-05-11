import Link from 'next/link'
import { DocsHeaderNav } from '@/components/docs/docs-header-nav'

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex min-h-14 max-w-[min(100%,80rem)] flex-col gap-3 px-4 py-3 sm:min-h-16 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6 sm:py-0 lg:px-8 xl:px-10">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-6 lg:gap-8">
            <Link href="/docs" className="group shrink-0">
              <span className="block text-sm font-semibold tracking-tight text-foreground group-hover:text-primary">
                产品文档
              </span>
              <span className="hidden text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground sm:block">
                多租户 · RBAC · OIDC
              </span>
            </Link>
            <DocsHeaderNav />
          </div>
          <Link
            href="/login"
            className="shrink-0 rounded-full border border-border/80 bg-background px-4 py-2 text-xs font-medium text-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/50 sm:text-sm"
          >
            控制台登录
          </Link>
        </div>
      </header>
      <main className="min-w-0">{children}</main>
    </div>
  )
}
