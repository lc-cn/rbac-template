import type { Metadata } from 'next'
import Link from 'next/link'
import { DocsArticle } from '@/components/docs/docs-article'

export const metadata: Metadata = {
  title: '管理控制台',
  description: '仪表盘与各业务菜单的职责说明：用户、角色、权限、应用、功能模块，及与 RBAC 权限码的对应关系。',
}

export default function DocsConsolePage() {
  return (
    <DocsArticle
      title="管理控制台"
      description="控制台即登录后的主应用（/ 及各业务路由）。以下按侧栏模块说明能力边界；实际能否操作取决于当前租户内的 RBAC 与治理规则。"
    >
      <section className="space-y-4">
        <h2 className="docs-article-h2">仪表盘（/）</h2>
        <p>登录且已选择租户后的首页，用于总览与快捷入口；具体卡片与指标随产品迭代可能调整。</p>
      </section>

      <section className="space-y-4">
        <h2 className="docs-article-h2">个人中心（/profile）</h2>
        <p>
          当前账号资料、与安全相关的设置（如 Passkey、MFA、备份码等，视部署启用情况而定）。该区域主要服务<strong className="text-foreground">管理员自身账号</strong>，与「为第三方应用配置
          OAuth 客户端」属于不同概念；后者在应用管理中完成。
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="docs-article-h2">用户（/users）</h2>
        <p>
          在当前租户下浏览与维护用户目录：邀请或创建成员、分配业务角色、在策略允许时调整 <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">tenantRole</code> 等。读操作通常需要{' '}
          <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">user:read</code>；创建 / 更新 / 删除对应{' '}
          <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">user:create</code>、
          <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">user:update</code>、
          <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">user:delete</code>，且写路径同时受第一波治理规则约束（详见{' '}
          <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/docs/rbac">
            权限与治理
          </Link>
          ）。
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="docs-article-h2">角色（/roles）与权限（/permissions）</h2>
        <p>
          <strong className="text-foreground">角色</strong>是租户内权限的集合：为角色勾选若干 <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">Permission</code> 后，再将角色分配给用户即完成授权。
          <strong className="text-foreground">权限</strong>菜单用于维护权限码资源本身（增删改查 permission 定义），适合平台扩展新业务模块时使用。
        </p>
        <p>
          典型 RBAC 权限码与 API 映射见治理矩阵文档；常量定义在{' '}
          <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">src/lib/permission-codes.ts</code>。
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="docs-article-h2">应用管理（/applications）</h2>
        <p>
          业务<strong className="text-foreground">应用（Application）</strong>是租户内的产品单元：可维护名称、Logo 等展示信息，供 OAuth 同意页等场景使用。每个应用可进一步配置<strong className="text-foreground">OIDC /
          OAuth2 客户端</strong>（回调、密钥、scope、PKCE 策略等），对应 API 权限为 <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">oauth_client:read</code> /{' '}
          <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">oauth_client:write</code>。协议与端点细节见{' '}
          <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/docs/oauth2">
            OIDC 接入指南
          </Link>
          。
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="docs-article-h2">功能模块（/features）</h2>
        <p>
          表示挂在某一应用下的<strong className="text-foreground">功能模块（Feature）</strong>实体，用于在产品内做模块化开关或文档化说明（与「环境特性开关 FEATURE_*」不是同一概念）。对应权限码前缀为{' '}
          <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">feature:</code>。
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="docs-article-h2">系统配置（/system-config）</h2>
        <p>
          租户级或全局可见的系统参数（如站点名称等，以实现为准）。读取需要 <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">system_config:read</code>，更新需要{' '}
          <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">system_config:update</code>。更完整的平台视角说明见{' '}
          <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/docs/system-platform">
            系统与平台
          </Link>
          。
        </p>
      </section>
    </DocsArticle>
  )
}
