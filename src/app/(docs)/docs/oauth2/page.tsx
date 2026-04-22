import type { Metadata } from 'next'
import { getOAuthIssuer } from '@/lib/oauth2/issuer'
import { oauthSigningAlgsSupported } from '@/lib/oauth2/jwt-as'

export const metadata: Metadata = {
  title: 'OAuth2 / OIDC 客户端接入指南',
  description:
    '企业级授权服务器对接说明：Discovery、客户端注册、授权码与 PKCE、令牌与刷新、UserInfo、吊销与自省、登出与安全合规要点。',
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
    issuer = 'https://<部署域名>'
  }
  const algs = oauthSigningAlgsSupported().join(', ')

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-10 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Integration · Public</p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">OAuth2 / OIDC 客户端接入指南</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          本系统在企业场景下同时承担 <strong className="text-foreground">授权服务器（Authorization Server / OpenID Provider）</strong>
          角色；贵司或生态伙伴的业务应用作为 <strong className="text-foreground">OAuth 2.0 客户端（Relying Party）</strong>
          ，通过标准协议完成用户身份委托与令牌交换。以下说明适用于方案设计、联调验收与生产运维阶段。
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          文档中的占位符 <Code>{'{ISSUER}'}</Code> 在本部署环境中解析为 <Code>{issuer}</Code>
          （优先读取环境变量 <Code>OAUTH_ISSUER_URL</Code>；未配置时回退至 <Code>NEXTAUTH_URL</Code>。issuer 字符串<strong className="text-foreground">不得包含末尾斜杠</strong>
          ，并与对外提供的 HTTPS 基线一致）。
        </p>
      </header>

      <nav className="mb-10 rounded-xl border border-border/60 bg-muted/30 p-4 text-sm">
        <p className="mb-2 font-semibold text-foreground">本文档结构</p>
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
            建议将「拉取 OIDC Provider 元数据」作为集成工作的<strong className="text-foreground">第一步</strong>
            ：客户端可根据元数据动态发现各端点 URL，避免在业务代码中硬编码路径，从而在 issuer 迁移、多区域部署或路径策略调整时保持兼容与可维护性。元数据响应可按贵司缓存策略做短期缓存（须预留失效与刷新机制）。
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
            <Code>grant_types_supported</Code>、<Code>scopes_supported</Code>、<Code>id_token_signing_alg_values_supported</Code> 等字段请以<strong className="text-foreground">线上实际响应</strong>
            为准，勿依赖本文示例中的字面顺序。当前部署所声明的 ID Token / Access Token 相关签名算法包括：<Code>{algs}</Code>。
          </p>
        </section>

        <section className="space-y-3">
          <H2 id="register">2. 在管理控制台注册 OAuth2 客户端</H2>
          <p>
            请由具备相应<strong className="text-foreground">后台管理权限</strong>的账号登录控制台，在侧栏进入{' '}
            <strong className="text-foreground">「OAuth2 客户端」</strong>模块：于 <Code>/oauth2-clients</Code> 维护客户端清单，在{' '}
            <Code>/oauth2-clients/new</Code> 创建新客户端，或通过 <Code>/oauth2-clients/&lt;内部标识&gt;/edit</Code> 进入编辑页完成参数治理。
            对于<strong className="text-foreground">机密（Confidential）客户端</strong>，在创建或轮换密钥后，请务必在安全渠道留存页面一次性展示的{' '}
            <Code>client_secret</Code>；系统不会再次提供明文。
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
            开发环境可通过种子脚本 <Code>pnpm run seed</Code> 预置示例机密客户端（若尚不存在）：<Code>rbac_demo_client</Code> /{' '}
            <Code>demo_secret_please_change</Code>。该凭据<strong className="text-foreground">仅限本地与联调环境</strong>
            ，禁止进入生产或面向最终用户的发布渠道；生产环境请单独创建客户端并遵循贵司密钥管理规范。
          </p>
        </section>

        <section className="space-y-3">
          <H2 id="flow">3. 授权码许可类型与 PKCE</H2>
          <p>
            本授权服务器推荐使用 <strong className="text-foreground">授权码流程（Authorization Code）</strong>
            并结合 <strong className="text-foreground">PKCE（RFC 7636）</strong>
            ，以满足浏览器端、移动应用及无法安全存储客户端密钥的场景下的行业安全基线。
          </p>
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
              若终端用户尚未建立控制台会话，将先被引导至 <Code>/login</Code> 完成身份校验；成功后自动回到上述授权请求 URL，保证授权上下文连续。
            </li>
            <li>
              已登录用户将进入<strong className="text-foreground">授权同意页</strong>（<Code>/oauth/consent</Code>），在明确同意后，浏览器将携带{' '}
              <Code>code</Code> 重定向至贵方事先登记的 <Code>redirect_uri</Code>。
            </li>
            <li>
              贵方<strong className="text-foreground">后端服务</strong>在收到授权码后，应调用令牌端点完成换票（见下一节），并严格校验 <Code>state</Code> 与 PKCE 参数，防范授权码拦截与重放类风险。
            </li>
          </ol>
        </section>

        <section className="space-y-3">
          <H2 id="token">4. 令牌端点（Token Endpoint）</H2>
          <p>
            令牌请求统一使用 <Code>POST {'{ISSUER}'}/oauth/token</Code>，<Code>Content-Type</Code> 为{' '}
            <Code>application/x-www-form-urlencoded</Code>。请在后端发起，避免将 <Code>client_secret</Code> 暴露于用户代理环境。
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
            <li>
              本实现采用<strong className="text-foreground">刷新令牌轮换（Refresh Token Rotation）</strong>
              ：每次成功刷新将签发新的 <Code>refresh_token</Code>，此前已下发的刷新令牌即告失效，请贵方持久化最新返回值。
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <H2 id="other">5. UserInfo、令牌吊销、自省与终端用户登出</H2>
          <ul className="list-disc space-y-3 pl-5">
            <li>
              <strong className="text-foreground">UserInfo</strong>：<Code>GET {'{ISSUER}'}/oauth/userinfo</Code>，请求头{' '}
              <Code>Authorization: Bearer {'{access_token}'}</Code>。返回字段受 access token 中 scope 约束。
            </li>
            <li>
              <strong className="text-foreground">吊销（RFC 7009）</strong>：<Code>POST {'{ISSUER}'}/oauth/revoke</Code>，表单字段{' '}
              <Code>token</Code>；可选 <Code>token_type_hint</Code>。当前实现侧重对持久化存储的 <Code>refresh_token</Code> 进行吊销；对无状态 JWT 形态的 access token 未提供全局撤销表，请在架构设计时结合业务 TTL 与自省接口综合评估。
            </li>
            <li>
              <strong className="text-foreground">自省（RFC 7662）</strong>：<Code>POST {'{ISSUER}'}/oauth/introspect</Code>，需{' '}
              <Code>client_id</Code> 与机密客户端的 <Code>client_secret</Code>（或 Basic），表单字段 <Code>token</Code>。
            </li>
            <li>
              <strong className="text-foreground">登出</strong>：<Code>GET {'{ISSUER}'}/oauth/logout?client_id=...&post_logout_redirect_uri=...&state=...</Code>
              。其中 <Code>post_logout_redirect_uri</Code> 须与在控制台为该客户端登记的「登出后回调」白名单逐项一致；校验通过后，将依次完成本系统会话终止与对贵方地址的重定向。开发环境可能对 <Code>localhost</Code> 回调给予便利策略；<strong className="text-foreground">生产环境请务必使用 HTTPS 并采用最小化白名单</strong>。
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <H2 id="security">6. 安全合规清单与实施建议</H2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              在授权请求与回调处理中<strong className="text-foreground">强制校验</strong> <Code>state</Code>；在 OIDC 场景下配合使用 <Code>nonce</Code> 校验 <Code>id_token</Code>，降低会话固定与混淆风险。
            </li>
            <li>
              <Code>client_secret</Code> 仅允许存在于贵方<strong className="text-foreground">受控服务端</strong>
              ，不得嵌入前端脚本、移动应用安装包或公开仓库。
            </li>
            <li>
              对无法安全持有客户端密钥的公开客户端，<strong className="text-foreground">必须</strong>启用 PKCE；不得因实施便利在公开渠道使用机密客户端模型。
            </li>
            <li>生产环境对外链路应全程使用 TLS（HTTPS），并确保证书域名与 issuer、回调域名策略一致。</li>
            <li>
              建议配置 <Code>OAUTH_RSA_PRIVATE_KEY_B64</Code>（或等价 PEM）以启用 <strong className="text-foreground">RS256</strong> 与 JWKS 发布能力；在未启用非对称密钥时，系统可能采用 HS256 等对称方案，由授权服务器持有签名密钥，依赖方宜通过 UserInfo 或自省接口完成令牌语义校验。
            </li>
          </ul>
          <div className="rounded-xl border border-border/70 bg-muted/25 p-4 text-xs leading-relaxed text-muted-foreground">
            <p className="font-semibold text-foreground">免责声明与变更说明</p>
            <p className="mt-2">
              本文档旨在描述本仓库当前版本的典型集成路径；若贵司在二次开发中调整了路由、端点语义或安全策略，请以<strong className="text-foreground">线上 Discovery 响应与正式发布说明</strong>
              为准。建议在预生产环境使用独立注册的测试客户端完成回归，通过后再推进生产变更窗口。
            </p>
          </div>
        </section>
      </div>
    </article>
  )
}
