import type { Metadata } from 'next'
import Link from 'next/link'
import { DocsArticle } from '@/components/docs/docs-article'

export const metadata: Metadata = {
  title: '产品概述',
  description:
    '本仓库提供的能力边界：逻辑多租户、租户内 RBAC、管理控制台、内置 OAuth2/OIDC 授权服务器，以及与控制台登录正交的身份能力。',
}

export default function DocsOverviewPage() {
  return (
    <DocsArticle
      title="产品概述"
      description="本文从「能力地图」角度说明本模板解决什么问题、适合什么场景，并指向各专题文档。"
    >
      <section className="space-y-4">
        <h2 className="docs-article-h2">本系统是什么</h2>
        <p>
          这是一套面向企业内部的<strong className="text-foreground">身份与访问管理（IAM）控制台模板</strong>
          ：在单一部署下承载多个<strong className="text-foreground">租户（组织）</strong>，每个租户内独立维护用户、业务角色、权限码、业务应用及其 OAuth2/OIDC
          客户端配置。管理员通过浏览器登录控制台完成日常治理；第三方业务系统则通过标准 OAuth2/OIDC 协议向本系统申请访问令牌，完成用户身份委托。
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="docs-article-h2">能力地图</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/docs/tenants">
              多租户与组织治理
            </Link>
            ：租户隔离、成员与 <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">owner</code> /{' '}
            <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">admin</code> /{' '}
            <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">member</code> 角色、创建组织入口与只读租户策略等。
          </li>
          <li>
            <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/docs/rbac">
              权限与治理
            </Link>
            ：租户内 RBAC（<code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">Permission.code</code>）与第一波用户治理规则如何叠加，以及 HTTP 403 机器码含义。
          </li>
          <li>
            <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/docs/console">
              管理控制台
            </Link>
            ：仪表盘、用户、角色、权限、应用、功能模块等界面与典型操作流程（均受 RBAC 守卫）。
          </li>
          <li>
            <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/docs/system-platform">
              系统配置与平台总览
            </Link>
            ：站点级参数、具备平台管理员标记账号的只读跨租户视图。
          </li>
          <li>
            <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/docs/security">
              身份与安全
            </Link>
            ：控制台登录方式（密码、Passkey、MFA、备份码与恢复流程）及与环境变量相关的安全基线。
          </li>
          <li>
            <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/docs/oauth2">
              OIDC / OAuth2 接入指南
            </Link>
            ：本系统作为授权服务器（IdP）时，第三方客户端的 Discovery、授权码 + PKCE、令牌与 UserInfo 等端点说明（长文）。
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="docs-article-h2">与「公开文档」和「控制台」的关系</h2>
        <p>
          您正在阅读的 <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">/docs</code> 路由<strong className="text-foreground">无需登录</strong>
          ，便于评审、联调与分享。涉及租户数据、密钥与回调地址等敏感操作，必须在登录控制台后由具备相应权限的账号完成；切勿在公开场合泄露{' '}
          <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">client_secret</code> 或备份码。
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="docs-article-h2">领域词汇与源码线索</h2>
        <p>
          仓库根目录 <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">CONTEXT.md</code> 汇总了租户、slug、平台管理员等术语；实现细节还可对照{' '}
          <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">docs/governance-matrix.md</code> 与{' '}
          <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">docs/adr/</code> 中的架构记录。
        </p>
      </section>
    </DocsArticle>
  )
}
