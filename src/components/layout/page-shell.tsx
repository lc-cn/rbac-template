import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * 应用内页统一容器：最大宽度、页边距、区块纵向节奏（与 globals.css `.app-page` 配套）。
 */
export function PageShell({
  children,
  className,
  density = 'default',
}: {
  children: ReactNode
  className?: string
  /** comfortable：区块间距略紧，适合信息密度高的页 */
  density?: 'default' | 'comfortable'
}) {
  return (
    <div
      className={cn(
        'app-page',
        density === 'comfortable' && 'app-page--comfortable',
        className
      )}
    >
      {children}
    </div>
  )
}

/** 页顶标题区：标题、副文案、主操作（与 `.app-page-header` 配套） */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <header className={cn('app-page-header', className)}>
      <div className="min-w-0 space-y-1">
        <h1 className="app-page-title">{title}</h1>
        {description != null ? (
          typeof description === 'string' ? (
            <p className="app-page-desc">{description}</p>
          ) : (
            <div className="app-page-desc">{description}</div>
          )
        ) : null}
      </div>
      {actions ? <div className="app-page-header-actions">{actions}</div> : null}
    </header>
  )
}

/** 卡片顶工具行（搜索 + 按钮等），可传 className 微调对齐（如 items-stretch） */
export function CardToolbar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('app-card-toolbar', className)}>{children}</div>
}
