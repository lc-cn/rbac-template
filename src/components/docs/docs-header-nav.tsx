'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { docsNavItems, isDocsNavActive } from '@/lib/docs-nav'

export function DocsHeaderNav() {
  const pathname = usePathname()

  return (
    <nav
      className="-mx-1 flex min-w-0 max-w-[min(100%,48rem)] flex-nowrap items-center gap-0.5 overflow-x-auto overscroll-x-contain px-1 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-1 [&::-webkit-scrollbar]:hidden"
      aria-label="文档导航"
    >
      {docsNavItems.map((item) => {
        const active = isDocsNavActive(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'shrink-0 rounded-lg px-2 py-1.5 text-xs transition-colors sm:px-3 sm:py-2 sm:text-sm',
              active
                ? 'bg-muted font-medium text-foreground'
                : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
