import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BookOpen, Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: '开发者文档 · 开放平台',
  description:
    '面向技术团队与生态合作伙伴：身份与授权、OAuth2 / OIDC 集成说明。公开查阅，无需登录管理控制台。',
}

export default function DocsHomePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <header className="mb-12 space-y-4 text-center sm:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Developer Center</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">开发者文档与集成指南</h1>
        <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:mx-0">
          本站点在提供管理控制台的同时，内置符合行业惯例的{' '}
          <strong className="font-medium text-foreground">OAuth 2.0</strong> 与{' '}
          <strong className="font-medium text-foreground">OpenID Connect</strong>{' '}
          能力，可作为企业内部的授权服务器（Authorization Server / IdP）。以下文档帮助贵司工程团队完成客户端注册、授权流程与安全对接，支持联调、验收与生产上线各阶段参考。
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-1">
        <Link
          href="/docs/oauth2"
          className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6 shadow-sm ring-1 ring-black/[0.04] transition-all hover:border-primary/30 hover:shadow-md dark:ring-white/[0.06]"
        >
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 space-y-2">
              <h2 className="text-lg font-semibold tracking-tight text-foreground group-hover:text-primary">
                OAuth2 / OIDC 客户端接入指南
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                覆盖 OIDC Discovery、授权码与 PKCE、令牌与刷新、UserInfo、令牌吊销与自省、RP-Initiated
                登出等端点说明，以及控制台中的客户端注册与安全清单。
              </p>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                查看完整文档
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
            </div>
          </div>
        </Link>

        <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-5 sm:p-6">
          <div className="flex gap-3">
            <Shield className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p className="font-medium text-foreground">访问说明</p>
              <p>
                文档区域<strong className="font-medium text-foreground">无需登录</strong>
                ，便于在采购评估、安全评审或外包联调时直接分享链接。涉及客户端密钥、回调地址等敏感配置，请在管理控制台中由授权管理员操作；切勿在公开场合泄露{' '}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">client_secret</code>。
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-14 border-t border-border/50 pt-8 text-center text-xs text-muted-foreground sm:text-left">
        <p>需要管理用户、角色与 OAuth 客户端？请使用具备权限的账号</p>
        <Link href="/login" className="mt-2 inline-flex font-medium text-primary underline-offset-4 hover:underline">
          前往控制台登录
        </Link>
      </footer>
    </div>
  )
}
