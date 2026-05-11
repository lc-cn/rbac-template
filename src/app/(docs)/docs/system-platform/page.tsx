import type { Metadata } from 'next'
import Link from 'next/link'
import { DocsArticle } from '@/components/docs/docs-article'

export const metadata: Metadata = {
  title: '系统与平台',
  description: '系统配置页与平台管理员只读跨租户总览的职责边界。',
}

export default function DocsSystemPlatformPage() {
  return (
    <DocsArticle
      title="系统与平台"
      description="「系统配置」服务租户内运维参数；「平台总览」服务具备平台管理员标记的账号在无当前租户时的只读跨库视图。"
    >
      <section className="space-y-4">
        <h2 className="docs-article-h2">系统配置（/system-config）</h2>
        <p>
          用于维护运行时可调的关键参数（具体字段以实现与 UI 为准），例如站点展示名等。所有变更均应在变更窗口与权限审批流程内进行；缺少{' '}
          <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">system_config:update</code> 权限的账号无法通过 API 持久化修改。
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="docs-article-h2">平台总览（/platform）</h2>
        <p>
          仅当会话中用户具备 <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">isPlatformAdmin</code> 标记时，侧栏会出现「平台」入口。该视图用于在<strong className="text-foreground">未选择租户</strong>（无{' '}
          <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">currentTenantId</code>）时浏览跨租户的<strong className="text-foreground">只读</strong>信息；不替代租户内的 RBAC 管理操作。
        </p>
        <p>
          平台 API（<code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">/api/platform/*</code>）同样设计为只读；若需对某一租户数据做写入，必须先切换到该租户并具备相应业务权限。详见{' '}
          <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/docs/rbac">
            权限与治理
          </Link>
          中平台管理员章节。
        </p>
      </section>
    </DocsArticle>
  )
}
