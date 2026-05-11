import type { Metadata } from 'next'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  BookOpen,
  Building2,
  LayoutGrid,
  Lock,
  Monitor,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react'

export const metadata: Metadata = {
  title: '产品文档',
  description:
    '多租户 RBAC 管理控制台、系统与平台能力、控制台身份安全，以及内置 OAuth2/OIDC 授权服务器说明。公开查阅，无需登录。',
}

type DocCard = {
  href: string
  title: string
  description: string
  icon: LucideIcon
}

const docCards: DocCard[] = [
  {
    href: '/docs/overview',
    title: '产品概述',
    description: '能力地图、公开文档与控制台的关系、领域词汇与源码线索。',
    icon: Sparkles,
  },
  {
    href: '/docs/tenants',
    title: '多租户与组织',
    description: '租户与 slug、成员与 tenantRole、创建组织、只读租户与 OAuth 行为、可选邀请与 owner 移交。',
    icon: Building2,
  },
  {
    href: '/docs/rbac',
    title: '权限与治理',
    description: '治理规则与 Permission.code 两波叠加、403 机器码、平台管理员、ENFORCE_RBAC_ON_WRITE 与升级种子。',
    icon: ShieldCheck,
  },
  {
    href: '/docs/console',
    title: '管理控制台',
    description: '仪表盘、个人中心、用户、角色、权限、应用与 OIDC、功能模块、系统配置等菜单职责。',
    icon: Monitor,
  },
  {
    href: '/docs/system-platform',
    title: '系统与平台',
    description: '系统配置页与平台管理员只读跨租户总览（/platform）的边界。',
    icon: SlidersHorizontal,
  },
  {
    href: '/docs/security',
    title: '身份与安全',
    description: '控制台登录（密码、Passkey、MFA）、恢复与加密相关环境变量、与会话租户切换。',
    icon: Lock,
  },
  {
    href: '/docs/oauth2',
    title: 'OIDC / OAuth2 接入指南',
    description: 'Discovery、授权码与 PKCE、令牌与刷新、UserInfo、吊销与自省、登出与安全清单（长文）。',
    icon: BookOpen,
  },
]

export default function DocsHomePage() {
  return (
    <div className="docs-doc-shell">
      <div className="mx-auto w-full max-w-[min(100%,80rem)] px-4 py-14 sm:px-6 sm:py-20 lg:px-8 xl:px-10">
        <div className="mx-auto max-w-5xl">
          <header className="mb-12 space-y-4 text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Documentation</p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">产品文档</h1>
            <p className="mx-auto max-w-3xl text-base leading-relaxed text-muted-foreground sm:mx-0">
              本仓库提供<strong className="font-medium text-foreground">逻辑多租户</strong>下的管理控制台、
              <strong className="font-medium text-foreground">租户内 RBAC</strong>、
              <strong className="font-medium text-foreground">内置 OAuth2 / OIDC 授权服务器</strong>
              ，以及平台级只读总览等能力。以下章节按模块介绍概念、界面入口与权限边界；协议与端点细节集中在 OIDC 接入指南。
            </p>
          </header>

          <div className="grid gap-4 sm:grid-cols-2">
            {docCards.map((card) => {
              const Icon = card.icon
              return (
                <Link
                  key={card.href}
                  href={card.href}
                  className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6 shadow-sm ring-1 ring-black/[0.04] transition-all hover:border-primary/30 hover:shadow-md dark:ring-white/[0.06]"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1 space-y-2">
                      <h2 className="text-lg font-semibold tracking-tight text-foreground group-hover:text-primary">{card.title}</h2>
                      <p className="text-sm leading-relaxed text-muted-foreground">{card.description}</p>
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                        阅读
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-border/80 bg-muted/20 p-5 sm:p-6">
            <div className="flex gap-3">
              <Shield className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
              <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                <p className="font-medium text-foreground">访问说明</p>
                <p>
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">/docs</code> 下页面<strong className="font-medium text-foreground">无需登录</strong>
                  ，便于采购评估、安全评审或外包联调。涉及密钥、回调与生产数据的操作，请在控制台中由具备权限的账号完成。
                </p>
              </div>
            </div>
          </div>

          <p className="mt-8 flex flex-wrap items-center justify-center gap-2 text-center text-sm text-muted-foreground sm:justify-start">
            <LayoutGrid className="hidden h-4 w-4 shrink-0 sm:inline" aria-hidden />
            <span>需要按路由快速对照权限？请打开仓库内</span>
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">docs/governance-matrix.md</code>
          </p>

          <footer className="mt-14 border-t border-border/50 pt-8 text-center text-xs text-muted-foreground sm:text-left">
            <p>需要管理用户、角色与 OAuth 客户端？请使用具备权限的账号</p>
            <Link href="/login" className="mt-2 inline-flex font-medium text-primary underline-offset-4 hover:underline">
              前往控制台登录
            </Link>
          </footer>
        </div>
      </div>
    </div>
  )
}
