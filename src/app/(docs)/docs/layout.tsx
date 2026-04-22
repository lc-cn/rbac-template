import Link from 'next/link'

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-6 px-4 sm:h-16 sm:px-6">
          <div className="flex min-w-0 items-center gap-6">
            <Link href="/docs" className="group shrink-0">
              <span className="block text-sm font-semibold tracking-tight text-foreground group-hover:text-primary">
                开发者文档
              </span>
              <span className="hidden text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground sm:block">
                Identity · OAuth2 · OIDC
              </span>
            </Link>
            <nav className="flex items-center gap-0.5 text-xs sm:gap-1 sm:text-sm" aria-label="文档导航">
              <Link
                href="/docs"
                className="rounded-lg px-2 py-1.5 text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground sm:px-3 sm:py-2"
              >
                概览
              </Link>
              <Link
                href="/docs/oauth2"
                className="rounded-lg px-2 py-1.5 text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground sm:px-3 sm:py-2"
              >
                <span className="sm:hidden">OAuth2</span>
                <span className="hidden sm:inline">OAuth2 / OIDC</span>
              </Link>
            </nav>
          </div>
          <Link
            href="/login"
            className="shrink-0 rounded-full border border-border/80 bg-background px-4 py-2 text-xs font-medium text-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/50 sm:text-sm"
          >
            控制台登录
          </Link>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
