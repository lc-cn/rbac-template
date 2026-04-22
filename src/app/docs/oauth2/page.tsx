import type { Metadata } from 'next'
import { getOAuthIssuer } from '@/lib/oauth2/issuer'
import { oauthSigningAlgsSupported } from '@/lib/oauth2/jwt-as'

export const metadata: Metadata = {
  title: 'OAuth2 / OIDC 客户端对接指南',
  description: '第三方应用（RP）对接本系统自建授权服务器的步骤、端点与安全要点。',
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-md border border-border/60 bg-muted/80 px-1.5 py-0.5 font-mono text-[0.8125rem] text-foreground">
      {children}
    </code>
  )
}

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-24 border-b border-border/50 pb-2 text-lg font-semibold tracking-tight">
      {children}
    </h2>
  )
}

export default async function OAuth2DocsPage() {
  let issuer: string
  try {
    issuer = getOAuthIssuer()
  } catch {
    issuer = 'https://你的站点根域名'
  }
  const algs = oauthSigningAlgsSupported().join(', ')

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-10 space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">对外文档 · 免登录</p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">OAuth2 / OIDC 客户端对接指南</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          本系统将自身作为 <strong className="text-foreground">授权服务器（AS / IdP）</strong>
          ，你的业务站点作为 <strong className="text-foreground">OAuth2 客户端（Client / RP）</strong>
          。下文中的 <Code>{'{ISSUER}'}</Code> 当前解析为：
          <Code>{issuer}</Code>
          （来自环境变量 <Code>OAUTH_ISSUER_URL</Code>，未设置时使用 <Code>NEXTAUTH_URL</Code>，须无末尾斜杠）。
        </p>
      </header>

      <nav className="mb-10 rounded-xl border border-border/60 bg-muted/30 p-4 text-sm">
        <p className="mb-2 font-medium text-foreground">目录</p>
        <ol className="list-decimal space-y-1 pl-5 text-muted-foreground marker:text-foreground/60">
          <li>
            <a href="#discovery" className="hover:text-foreground">
              元数据与端点发现
            </a>
          </li>
          <li>
            <a href="#register" className="hover:text-foreground">
              在本系统注册客户端
            </a>
          </li>
          <li>
            <a href="#flow" className="hover:text-foreground">
              授权码 + PKCE 对接流程
            </a>
          </li>
          <li>
            <a href="#token" className="hover:text-foreground">
              令牌端点（换 token 与刷新）
            </a>
          </li>
          <li>
            <a href="#other" className="hover:text-foreground">
              UserInfo、吊销、自省、登出
            </a>
          </li>
          <li>
            <a href="#security" className="hover:text-foreground">
              安全清单与常见问题
            </a>
          </li>
        </ol>
      </nav>

      <div className="space-y-10 text-sm leading-relaxed text-muted-foreground">
        <section className="space-y-3">
          <H2 id="discovery">1. 元数据与端点发现</H2>
          <p>
            对接第一步请拉取 OIDC Provider 元数据（可缓存），不要硬编码各端点路径，以便将来 issuer 或路径调整时兼容。
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-foreground">Discovery</strong>：<Code>GET {'{ISSUER}'}/.well-known/openid-configuration</Code>
            </li>
            <li>
              <strong className="text-foreground">JWKS</strong>（当配置了 RSA 私钥时，元数据中会包含 <Code>jwks_uri</Code>）：<Code>GET {'{ISSUER}'}/.well-known/jwks.json</Code>
            </li>
          </ul>
          <p>
            元数据中的 <Code>authorization_endpoint</Code>、<Code>token_endpoint</Code>、<Code>userinfo_endpoint</Code>、
            <Code>revocation_endpoint</Code>、<Code>introspection_endpoint</Code>、<Code>end_session_endpoint</Code>、
            <Code>grant_types_supported</Code>、<Code>scopes_supported</Code>、<Code>id_token_signing_alg_values_supported</Code> 等字段请以实际响应为准。
            当前模板支持的 token 签名算法包括：<Code>{algs}</Code>。
          </p>
        </section>

        <section className="space-y-3">
          <H2 id="register">2. 在本系统注册客户端</H2>
          <p>
            使用具备后台权限的账号登录后，进入侧边栏 <strong className="text-foreground">「OAuth2 客户端」</strong>
            （<Code>/oauth2-clients</Code>）创建或编辑客户端，并保存界面一次性展示的 <Code>client_secret</Code>（机密客户端）。
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-foreground">登录回调 URI</strong>：与 OAuth2 授权请求里的 <Code>redirect_uri</Code> 必须
              <strong className="text-foreground">完全一致</strong>（协议、主机、端口、路径、末尾斜杠均敏感），支持多条。
            </li>
            <li>
              <strong className="text-foreground">登出后回调 URI</strong>：用于 OIDC 登出流程中的 <Code>post_logout_redirect_uri</Code> 白名单；见下文「登出」。
            </li>
            <li>
              <strong className="text-foreground">机密 vs 公开</strong>：机密客户端换 token 时必须带 <Code>client_secret</Code>（表单或 HTTP Basic）；公开客户端
              <strong className="text-foreground">必须</strong>使用 PKCE（见下一节）。
            </li>
            <li>
              <strong className="text-foreground">Scope 与授权类型</strong>：在后台勾选允许的 OIDC scope；若需刷新令牌，须启用「允许 refresh_token」并在授权时请求{' '}
              <Code>offline_access</Code>（且 scope 白名单内需包含该值）。
            </li>
            <li>
              <strong className="text-foreground">令牌生命周期</strong>：访问令牌有效期、刷新令牌天数、授权码分钟数可在客户端维度配置（有上下限保护）。
            </li>
          </ul>
          <p>
            本地开发种子脚本 <Code>pnpm run seed</Code> 会插入示例机密客户端（若不存在）：<Code>rbac_demo_client</Code> /{' '}
            <Code>demo_secret_please_change</Code>，仅用于联调，勿用于生产。
          </p>
        </section>

        <section className="space-y-3">
          <H2 id="flow">3. 授权码 + PKCE 对接流程</H2>
          <ol className="list-decimal space-y-3 pl-5 marker:font-medium marker:text-foreground">
            <li>
              生成 PKCE：<Code>code_verifier</Code> 为 43–128 字符的随机串；<Code>code_challenge = BASE64URL(SHA256(code_verifier))</Code>，无填充；<Code>code_challenge_method=S256</Code>。
            </li>
            <li>
              将用户浏览器重定向到 <Code>GET {'{ISSUER}'}/oauth/authorize</Code>，至少携带：
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>
                  <Code>response_type=code</Code>、<Code>client_id</Code>、<Code>redirect_uri</Code>、<Code>scope</Code>（如{' '}
                  <Code>openid profile email</Code>；需要刷新令牌时加上 <Code>offline_access</Code>）
                </li>
                <li>
                  <Code>state</Code>（防 CSRF，必做）
                </li>
                <li>
                  公开客户端：<Code>code_challenge</Code> 与 <Code>code_challenge_method=S256</Code>
                </li>
                <li>
                  OIDC 建议：<Code>nonce</Code>（用于校验 <Code>id_token</Code>）
                </li>
              </ul>
            </li>
            <li>
              若用户未登录本系统，会先跳转到 <Code>/login</Code>，登录完成后回到上述授权 URL。
            </li>
            <li>
              已登录用户将进入 <strong className="text-foreground">同意页</strong>（<Code>/oauth/consent</Code>），确认后携带{' '}
              <Code>code</Code> 重定向回你的 <Code>redirect_uri</Code>。
            </li>
            <li>
              你的服务端用 <Code>code</Code> 调用令牌端点换 token（见下一节），并校验 <Code>state</Code> 与 PKCE。
            </li>
          </ol>
        </section>

        <section className="space-y-3">
          <H2 id="token">4. 令牌端点</H2>
          <p>
            <Code>POST {'{ISSUER}'}/oauth/token</Code>，请求体为 <Code>application/x-www-form-urlencoded</Code>。
          </p>
          <h3 className="text-base font-semibold text-foreground">4.1 授权码换 token</h3>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <Code>grant_type=authorization_code</Code>
            </li>
            <li>
              <Code>code</Code>、<Code>redirect_uri</Code>（须与授权步骤一致）、<Code>client_id</Code>
            </li>
            <li>
              机密客户端：<Code>client_secret</Code> 或 HTTP Basic（<Code>Authorization: Basic base64(client_id:client_secret)</Code>）
            </li>
            <li>
              若授权时使用了 PKCE：<Code>code_verifier</Code>
            </li>
          </ul>
          <p>
            响应 JSON 含 <Code>access_token</Code>、<Code>expires_in</Code>、<Code>token_type</Code>、<Code>scope</Code>；若 scope 含{' '}
            <Code>openid</Code>，另有 <Code>id_token</Code>（JWT）。当客户端允许刷新且 scope 含 <Code>offline_access</Code> 时，另有{' '}
            <Code>refresh_token</Code>。
          </p>
          <h3 className="text-base font-semibold text-foreground">4.2 刷新访问令牌</h3>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <Code>grant_type=refresh_token</Code>、<Code>refresh_token</Code>、<Code>client_id</Code>
            </li>
            <li>机密客户端同样需 <Code>client_secret</Code> 或 Basic</li>
            <li>本实现采用刷新令牌轮换：每次成功刷新会返回新的 <Code>refresh_token</Code>，旧值作废。</li>
          </ul>
        </section>

        <section className="space-y-3">
          <H2 id="other">5. UserInfo、吊销、自省、登出</H2>
          <ul className="list-disc space-y-3 pl-5">
            <li>
              <strong className="text-foreground">UserInfo</strong>：<Code>GET {'{ISSUER}'}/oauth/userinfo</Code>，请求头{' '}
              <Code>Authorization: Bearer {'{access_token}'}</Code>。返回字段受 access token 中 scope 约束。
            </li>
            <li>
              <strong className="text-foreground">吊销（RFC 7009）</strong>：<Code>POST {'{ISSUER}'}/oauth/revoke</Code>，表单字段{' '}
              <Code>token</Code>；可选 <Code>token_type_hint</Code>。当前实现主要吊销库内保存的 <Code>refresh_token</Code>；无状态 JWT access token 未建全局黑名单。
            </li>
            <li>
              <strong className="text-foreground">自省（RFC 7662）</strong>：<Code>POST {'{ISSUER}'}/oauth/introspect</Code>，需{' '}
              <Code>client_id</Code> 与机密客户端的 <Code>client_secret</Code>（或 Basic），表单字段 <Code>token</Code>。
            </li>
            <li>
              <strong className="text-foreground">登出</strong>：<Code>GET {'{ISSUER}'}/oauth/logout?client_id=...&post_logout_redirect_uri=...&state=...</Code>
              。其中 <Code>post_logout_redirect_uri</Code> 必须在对应客户端后台登记的「登出后回调」白名单内；通过校验后会跳转本系统 NextAuth 登出，再重定向回你的地址。开发环境对 localhost 回调有额外放行策略，生产环境请使用 HTTPS 与严格白名单。
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <H2 id="security">6. 安全清单与常见问题</H2>
          <ul className="list-disc space-y-2 pl-5">
            <li>始终使用并校验 <Code>state</Code>；OIDC 使用 <Code>nonce</Code> 校验 <Code>id_token</Code>。</li>
            <li>
              <Code>client_secret</Code> 仅放在服务端，勿写入前端或移动端安装包。
            </li>
            <li>公开客户端必须 PKCE；不要在无法保护密钥的环境使用机密客户端。</li>
            <li>生产环境使用 HTTPS；issuer 与回调域名与证书一致。</li>
            <li>按需配置 <Code>OAUTH_RSA_PRIVATE_KEY_B64</Code>（或 PEM）以启用 RS256 与 JWKS；否则为 HS256（对称密钥由 AS 持有，RP 通常通过 userinfo 或自省校验会话）。</li>
          </ul>
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-950 dark:text-amber-100/90">
            本文档随模板代码演进；若你 fork 后修改了路径或行为，请以实际 Discovery 响应与源码为准。集成测试建议用种子客户端 + 本地回调（如 Vite <Code>:5173</Code>）先跑通再上生产。
          </p>
        </section>
      </div>
    </article>
  )
}
