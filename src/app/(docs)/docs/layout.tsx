import Link from 'next/link'

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="border-b border-border/60 bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/docs/oauth2" className="text-sm font-semibold tracking-tight">
            对接文档
          </Link>
          <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground">
            管理后台登录
          </Link>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
