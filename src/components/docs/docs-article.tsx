import type { ReactNode } from 'react'

type DocsArticleProps = {
  title: string
  description?: string
  children: ReactNode
}

/**
 * 标准文档正文页：与 OAuth2 长文页区分，此处为单栏版心 + prose。
 */
export function DocsArticle({ title, description, children }: DocsArticleProps) {
  return (
    <div className="docs-doc-shell">
      <div className="mx-auto w-full max-w-[min(100%,52rem)] px-4 py-10 sm:px-6 sm:py-14 lg:px-8 xl:px-10">
        <header className="mb-10 space-y-4 border-b border-border/45 pb-10">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-[2rem] sm:leading-snug">{title}</h1>
          {description ? (
            <p className="text-base leading-relaxed text-muted-foreground sm:text-[1.0625rem]">{description}</p>
          ) : null}
        </header>
        <div className="docs-prose space-y-10">{children}</div>
      </div>
    </div>
  )
}
