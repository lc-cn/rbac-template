import type { Metadata } from 'next'
import Link from 'next/link'
import { DocsArticle } from '@/components/docs/docs-article'

export const metadata: Metadata = {
  title: '身份与安全',
  description: '控制台登录：邮箱密码、Passkey、MFA 与备份码；与 OAuth2/OIDC 对第三方发令牌的区别；关键环境变量。',
}

export default function DocsSecurityPage() {
  return (
    <DocsArticle
      title="身份与安全"
      description="本节描述「谁以何种方式登录管理控制台」；第三方应用走 OAuth2/OIDC 获取访问令牌的路径在协议层独立，仅共享用户目录与租户上下文。"
    >
      <section className="space-y-4">
        <h2 className="docs-article-h2">控制台登录方式</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-foreground">邮箱 + 密码</strong>（Credentials）：传统账号口令登录。
          </li>
          <li>
            <strong className="text-foreground">Passkey（WebAuthn）</strong>：无密码或第二因素场景下的防钓鱼凭据；依赖正确的站点 origin 与 RP ID 配置（本地开发时{' '}
            <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">NEXTAUTH_URL</code> 应与浏览器访问地址一致）。
          </li>
          <li>
            <strong className="text-foreground">多因素认证（MFA）</strong>：在账号启用时，密码或 Passkey 登录后可能进入 MFA 校验页（<code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">/mfa</code>），支持 TOTP、MFA Passkey、备份码等组合（以实现为准）。
          </li>
        </ul>
        <p>
          上述能力与 <strong className="text-foreground">应用管理中为第三方配置 OIDC 客户端</strong>是两条链路：后者见{' '}
          <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/docs/oauth2">
            OIDC 接入指南
          </Link>
          。用户若未登录就访问授权端点，会先被引导完成控制台侧身份校验（必要时经 MFA），再回到授权 URL。
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="docs-article-h2">恢复与限流相关配置</h2>
        <p>
          备份码、恢复邮件链接等能力依赖安全的随机密钥与加密材料。生产环境应配置 <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">SECRETS_ENCRYPTION_KEY</code>、
          <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">RATE_LIMIT_PEPPER</code> 等（见根目录{' '}
          <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">.env.example</code>）。开发环境可使用 <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">MFA_RECOVERY_LOG_ONLY</code> 将恢复链接输出到日志而非真实邮件通道。
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="docs-article-h2">会话与租户切换</h2>
        <p>
          租户上下文与 MFA 待完成状态等声明由 Auth.js JWT / session 承载。切换租户应使用客户端 <code className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-px font-mono text-[0.8125rem]">update</code> 会话，由服务端校验成员关系，避免在 URL 或自定义 Cookie 中平行维护租户 ID。
        </p>
      </section>
    </DocsArticle>
  )
}
