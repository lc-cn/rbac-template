import type { Metadata } from 'next'
import Link from 'next/link'
import { DocsArticle } from '@/components/docs/docs-article'

export const metadata: Metadata = {
  title: '多租户与组织',
  description: '租户模型、成员角色、创建与切换组织、只读租户策略，及其与 OAuth 签发行为的关系。',
}

export default function DocsTenantsPage() {
  return (
    <DocsArticle
      title="多租户与组织"
      description="逻辑多租户通过共享数据库与行级 tenantId（及 UserTenant 等作用域）实现；以下说明与控制台、API 行为直接相关的概念。"
    >
      <section className="space-y-4">
        <h2 className="docs-article-h2">租户（Tenant）与 slug</h2>
        <p>
          租户表示<strong className="text-foreground">组织边界</strong>：用户、角色、权限、应用及其 OAuth 客户端等数据均挂在某一租户下。每个租户有全局唯一的稳定小写标识{' '}
          <strong className="text-foreground">slug</strong>，用于链接、日志与对接；当前产品阶段创建后<strong className="text-foreground">不可修改</strong>（详见{' '}
          <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">CONTEXT.md</code>）。
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="docs-article-h2">成员与租户级角色（tenantRole）</h2>
        <p>
          用户与租户的多对多关系由 <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">UserTenant</code> 表示，字段{' '}
          <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">tenantRole</code> 取值为{' '}
          <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">owner</code>、
          <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">admin</code> 或{' '}
          <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">member</code>。它描述的是<strong className="text-foreground">组织治理</strong>
          语义（例如部分用户管理写操作仅 owner/admin 可执行），与业务 RBAC 中的 <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">Role</code> /{' '}
          <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">Permission</code> 正交；二者同时生效时的顺序见{' '}
          <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/docs/rbac">
            权限与治理
          </Link>
          。
        </p>
        <p>每个租户<strong className="text-foreground">同时仅允许一名 owner</strong>，由数据库约束保障。</p>
      </section>

      <section className="space-y-4">
        <h2 className="docs-article-h2">当前租户上下文</h2>
        <p>
          会话中的 <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">currentTenantId</code> 仅通过 Auth.js 的 JWT / session 传递；客户端可调用{' '}
          <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">update({'{'} currentTenantId {'}'})</code> 切换租户，服务端在回调中校验{' '}
          <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">UserTenant</code> 成员关系。系统<strong className="text-foreground">不使用</strong> Cookie
          双写租户 ID。
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="docs-article-h2">创建组织与「无租户」状态</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            用户未加入任何租户时，登录后进入 <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">/no-tenant</code>，在环境允许时可自助创建组织（名称与可选
            slug），成功后写入会话租户并进入控制台。
          </li>
          <li>
            已加入租户的用户若需再建新组织，可走 <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">/organizations/new</code>（顶栏租户菜单内「新建组织」），无需先清空当前租户。
          </li>
          <li>
            环境变量 <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">ALLOW_SELF_SERVICE_TENANT_CREATE</code> 为关闭值时，自助创建入口隐藏，组织创建需由运维或其它流程接入。
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="docs-article-h2">归档、暂停与 OAuth 行为</h2>
        <p>
          第三波协作能力为租户引入 <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">archivedAt</code> /{' '}
          <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">suspendedAt</code> 等生命周期字段：处于只读或归档策略下的租户，其<strong className="text-foreground">变更类 API</strong>可能返回机器码{' '}
          <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">forbidden_tenant_read_only</code>。在归档租户下，OAuth 同意页与令牌端点<strong className="text-foreground">不再签发新令牌</strong>（详见{' '}
          <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">CONTEXT.md</code>）。
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="docs-article-h2">可选：邀请与 owner 移交</h2>
        <p>
          当环境变量 <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">FEATURE_INVITES</code>、
          <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">FEATURE_OWNER_TRANSFER</code> 未关闭时，仓库提供邀请与 owner 移交相关 API 与数据模型；关闭时对应路由不可用。具体以部署配置为准。
        </p>
      </section>
    </DocsArticle>
  )
}
