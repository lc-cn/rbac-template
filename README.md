# RBAC Template

基于 **Next.js 16**（App Router）、**@libsql/client**（直连 SQL + 轻量数据层）、**Tailwind CSS v4** 与 **shadcn/ui** 的全栈 **RBAC**（基于角色的访问控制）后台模板。认证使用 **NextAuth v4**（邮箱密码 + GitHub / Google OAuth）。

---

## 功能

- 用户管理（CRUD + 多角色分配）
- 角色管理（CRUD + 权限分配）
- 权限管理（按应用 / 功能分组）
- 应用与功能模块管理
- 系统配置（通用 k/v + OAuth2 提供商表，与登录页联动）
- 登录：邮箱密码；已启用且凭证非占位的 **GitHub / Google** 会出现在登录页

---

## 技术栈

| 层级 | 选型 |
|------|------|
| 框架 | Next.js 16 App Router、React 19 |
| 数据库 | [Turso](https://turso.tech) / LibSQL，[`@libsql/client`](https://github.com/tursodatabase/libsql-client-ts) |
| 数据访问 | `src/lib/data-access.ts`（手写 SQL）；NextAuth 适配器见 `src/lib/next-auth-libsql-adapter.ts` |
| 认证 | NextAuth v4（JWT Session + 自定义 LibSQL Adapter） |
| UI | Tailwind CSS v4、shadcn/ui、next-themes、站内 i18n（中/英） |

---

## 常用脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 本地开发 |
| `pnpm run build` | 生产构建（无 Prisma，仅 `next build`） |
| `pnpm start` | 启动生产构建产物 |
| `pnpm run typecheck` | TypeScript 检查 |
| `pnpm run lint` | ESLint |
| `pnpm run db:apply-sql` | 将 `sql/schema.sql`（或指定 `.sql`）应用到库；`schema.sql` 中 DDL 为 `IF NOT EXISTS`，已建库可重复执行以补表/索引。默认应用 `schema.sql` 时若检测到旧版 `OAuth2Client`（无 `applicationId`），会先 `DROP` 该表再建表（IdP 配置清空，需重配或 `pnpm run seed`） |
| `pnpm run db:apply-sql sql/migrations/002_oauth2_authorization_server.sql` | 旧库仅补 OAuth2 表时使用（新库已含于 `sql/schema.sql`） |
| `pnpm run db:apply-sql sql/migrations/005_oauth2_client_application_fk.sql` | 仅当库里 `Application` 仍带 `oauthClientId` 等列时执行一次（见 `sql/migrations/README.md`） |
| `pnpm run seed` | 写入初始数据（依赖 `.env` 中 `DATABASE_URL` / `DATABASE_AUTH_TOKEN`） |

---

## 快速开始（本地）

```bash
pnpm install
cp .env.example .env
# 将 .env 中的 DATABASE_URL、DATABASE_AUTH_TOKEN 填为 Turso 提供的值
# 可选：cp .env .env.local 供 Next 加载

# 空库：建表
pnpm run db:apply-sql

# 空库：种子数据（含默认管理员，见下表）
pnpm run seed

pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000)。**登录 / OAuth** 建议在 `.env` 或 `.env.local` 中配置 `NEXTAUTH_URL`（如 `http://localhost:3000`）与 `NEXTAUTH_SECRET`（生产务必使用强随机值；未配置时开发环境有代码内回退，**勿用于公网**）。

| 默认管理员邮箱 | 默认密码 |
|----------------|----------|
| admin@example.com | admin123 |

部署到公网后请**立即修改密码**或删除该账号。

### OAuth2（与「系统配置」联动）

NextAuth 在构建登录选项时会读取库中 **已启用** 且 **Client ID / Secret 非占位** 的 `OAuthProvider` 行：

- **`type` 为 `github` / `google`**：登录页展示对应按钮；在 GitHub / Google 控制台配置回调：`{NEXTAUTH_URL}/api/auth/callback/github` 或 `.../callback/google`。
- 其他类型（如微信）尚未接 Provider，仅保存在库中，不影响当前登录页。

---

## 部署到 Vercel（推荐流程）

Vercel Serverless **无法持久化本地 SQLite 文件**，生产环境请使用 **Turso（LibSQL）**。

### 1. 准备 Turso 数据库

```bash
# 安装 CLI（见 Turso 文档）
curl -sSfL https://get.tur.so/install.sh | bash
turso auth login
turso db create rbac-template

turso db show rbac-template --url    # 得到 libsql://...
turso db tokens create rbac-template  # 得到长令牌
```

### 2. 在本地对「线上空库」执行建表 + 种子（一次性）

在项目根配置与线上一致的 `DATABASE_URL`、`DATABASE_AUTH_TOKEN`（可临时写在 `.env` 或 shell `export`），然后：

```bash
pnpm install
pnpm run db:apply-sql
pnpm run seed
```

> **已有数据的库**不要再次执行全量 `sql/schema.sql`；需自行编写增量 SQL。

### 3. 将代码推到 GitHub

在 [Vercel Dashboard](https://vercel.com/dashboard) → **Add New…** → **Project** → **Import** 该仓库。检测到 `pnpm-lock.yaml` 时会使用 **pnpm**；**Build Command** 保持默认即可（`pnpm run build`）。

### 4. 在 Vercel 配置环境变量

路径：**Project → Settings → Environment Variables**。

| 变量名 | 建议勾选环境 | 说明 |
|--------|----------------|------|
| `DATABASE_URL` | Production、Preview、**Development**；**Build** 建议一并勾选 | `libsql://...` |
| `DATABASE_AUTH_TOKEN` | 同上 | Turso token |
| `NEXTAUTH_SECRET` | Production、Preview（Build 可不填） | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Production、Preview | 如 `https://你的项目.vercel.app`，**含 `https://`，无末尾 `/`**；换自定义域名后需同步修改 |

OAuth 回调在第三方控制台填写：`{NEXTAUTH_URL}/api/auth/callback/github` 等。

### 5. 构建与运行说明

- 构建命令为 **`next build`**，不依赖 Prisma。
- 首页等为 **动态渲染**（`force-dynamic`），**空库不会在构建阶段因查表失败而中断**；但 API 与登录仍依赖数据库，**首次上线前务必完成步骤 2**。
- 将 `DATABASE_*` 勾到 **Build**，可避免将来若某构建步骤访问 DB 时出现缺变量问题。

### 6. 触发部署

连接 GitHub 后，每次推送到默认分支会自动部署；也可本地安装 [Vercel CLI](https://vercel.com/docs/cli) 执行 `vercel` / `vercel --prod`。

---

## 数据库与 Schema（LibSQL）

- 连接串：**`DATABASE_URL` 必须为 `libsql://...`**（推荐 Turso），不使用 `file:` 本地库作为默认方案。
- 建表 DDL 固定在仓库 **`sql/schema.sql`**。

应用到远程库（不依赖 Turso CLI 能访问 `api.turso.tech`）：

```bash
pnpm run db:apply-sql
# 或：pnpm run db:apply-sql /绝对或相对路径/其它.sql
```

若本机可访问 Turso API，也可用：

```bash
turso db shell <数据库名> < sql/schema.sql
```

若出现 `lookup api.turso.tech: no such host`，多为 DNS/网络问题，可改用上面的 **`pnpm run db:apply-sql`** 直连 `libsql://`。

---

## 环境变量一览

完整注释模板见 [`.env.example`](.env.example)。

| 变量名 | 谁使用 | 必填场景 | 说明 |
|--------|--------|----------|------|
| `DATABASE_URL` | Next、`db:apply-sql`、`seed` | 开发与生产 | **`libsql://...`** |
| `DATABASE_AUTH_TOKEN` | 同上 | Turso 等远程库 | 访问令牌 |
| `NEXTAUTH_URL` | NextAuth | 生产与 OAuth **强烈建议** | 站点根 URL，无末尾 `/` |
| `NEXTAUTH_SECRET` | NextAuth | **生产必填** | 会话/JWT 签名；可用 `openssl rand -base64 32` |
| `AUTH_SECRET` | NextAuth | 可选 | 与 `NEXTAUTH_SECRET` 二选一；同时存在时 **优先 `NEXTAUTH_SECRET`** |
| `OAUTH_ISSUER_URL` | 自建 IdP Discovery / JWT `iss` | 可选 | 与 `NEXTAUTH_URL` 不同时配置（须无末尾 `/`） |
| `OAUTH_JWT_SECRET` | 自建 IdP 签发 access/id token | 可选 | ≥32 字符；未设则使用 `NEXTAUTH_SECRET` |

---

## 仓库结构（与数据相关）

```
sql/schema.sql              # 建表 + 索引 DDL（含 OAuth2 授权服务器表）
sql/migrations/002_oauth2_authorization_server.sql  # 仅给已存在旧库增量补表
scripts/apply-schema-sql.mjs   # 将 SQL 文件批量执行到 DATABASE_URL
scripts/seed.mjs            # 种子数据（Node，读 dotenv；含示例 OAuth2 Client）
src/lib/db.ts               # LibSQL 客户端单例、工具函数
src/lib/data-access.ts      # 业务 SQL / 聚合查询
src/lib/next-auth-libsql-adapter.ts  # NextAuth Database Adapter（LibSQL）
src/lib/oauth2/             # 自建 IdP：issuer、JWT、PKCE、授权码存储
src/app/oauth/              # /oauth/authorize、/oauth/token、/oauth/userinfo 等（Route Handler）
src/app/(flows)/oauth/consent/ # 同意页 UI（/oauth/consent；无控制台布局，与 `oauth/` 路由合并）
src/app/(docs)/docs/oauth2/ # 对外 OAuth2 对接文档（/docs/oauth2，免登录；路由分组不含控制台布局）
src/app/.well-known/openid-configuration/  # OIDC Discovery
```

---

## 自建 OAuth2 / OIDC 授权服务器

本仓库已实现 **授权码模式（RFC 6749）** + **OIDC Discovery** + **同意页** + **`userinfo`** + **PKCE（RFC 7636）** + **refresh_token** + **吊销 / 自省** + **RP 登出入口**，由本系统作为 **授权服务器（AS）**，第三方站点注册为 **OAuth2 Client** 后即可引导用户登录并换 token。

### 对接文档（对外 · 免登录）

部署后请将 `{NEXTAUTH_URL}` 换成你的站点根地址（与 `OAUTH_ISSUER_URL` 一致更佳）：

- **开发者文档首页**：**`/docs`**（概览与接入入口；示例：`http://localhost:3000/docs`）
- **OAuth2 / OIDC 客户端接入指南**：**`/docs/oauth2`**（示例：`http://localhost:3000/docs/oauth2`）

接入指南页会从运行时读取 `issuer` 与支持的签名算法，便于复制端点示例。中间件已放行 `/docs/**`，无需登录管理后台即可阅读；**登录页**提供前往 **`/docs`** 的引导入口。

### 对外端点（摘要）

| 端点 | 说明 |
|------|------|
| `GET /.well-known/openid-configuration` | OIDC Provider 元数据（`issuer`、`authorization_endpoint`、`token_endpoint`、`end_session_endpoint`、`jwks_uri` 等） |
| `GET /.well-known/jwks.json` | JWKS（配置 RSA 私钥环境变量后非空） |
| `GET /oauth/authorize` | 授权请求；未登录跳转 `/login`；已登录进入同意页后发 `code` |
| `POST /oauth/token` | `authorization_code`、`refresh_token`（`application/x-www-form-urlencoded`） |
| `GET /oauth/userinfo` | `Authorization: Bearer <access_token>` |
| `POST /oauth/revoke` | RFC 7009，吊销 refresh_token（见文档） |
| `POST /oauth/introspect` | RFC 7662 |
| `GET /oauth/logout` | OIDC 登出；校验 `post_logout_redirect_uri` 后走 NextAuth 登出 |

**Issuer**：优先读环境变量 `OAUTH_ISSUER_URL`，否则使用 `NEXTAUTH_URL`（须为对外可访问的根 URL，无末尾 `/`）。**JWT**：默认 **HS256**（`OAUTH_JWT_SECRET` / `NEXTAUTH_SECRET`）；可选配置 **RS256**（`OAUTH_RSA_PRIVATE_KEY_B64` 或 `OAUTH_RSA_PRIVATE_KEY_PEM`，详见 `.env.example`），此时 Discovery 会带 `jwks_uri`。

### 客户端类型

| 类型 | `OAuth2Client.clientSecretHash` | 授权 / 换 token 要求 |
|------|--------------------------------|------------------------|
| **机密（confidential）** | 非空（bcrypt 存哈希） | 换 token 时校验 `client_secret`（表单或 HTTP Basic）；授权端可选 PKCE；若授权时带了 `code_challenge`，换 token 必须带正确 `code_verifier` |
| **公开（public）** | `NULL` | 授权与换 token **必须 PKCE**（`code_challenge` + `code_challenge_method=S256`） |

`redirect_uri` 必须与库中 `OAuth2Client.redirectUrisJson`（JSON 字符串数组）**完全一致**（含端口、路径、`http`/`https`）。

### 种子中的示例客户端

执行 `pnpm run seed` 后会插入（若不存在）：

- `client_id`: **`rbac_demo_client`**
- `client_secret`: **`demo_secret_please_change`**
- 允许的 `redirect_uri`：`http://localhost:5173/oauth/callback`、`http://127.0.0.1:5173/oauth/callback`（可按需在库里改 `OAuth2Client.redirectUrisJson`）

生产环境请**删除或改密**，并登记真实业务域名回调。

### 第三方站点对接流程（摘要）

完整步骤、表单字段与安全清单见 **对接文档 `/docs/oauth2`**（与站点同域打开即可）。摘要如下：

1. `GET /.well-known/openid-configuration` 拉元数据。  
2. 302 用户到 `authorization_endpoint?response_type=code&client_id=...&redirect_uri=...&scope=...&state=...&code_challenge=...&code_challenge_method=S256&nonce=...`（公开客户端必须 PKCE）。  
3. 用户在本站登录并 **同意授权** 后，浏览器带 `code` 回到 `redirect_uri`。  
4. 业务站 **服务端** `POST token_endpoint`，`grant_type=authorization_code&code=...&redirect_uri=...&client_id=...&client_secret=...`（机密客户端）并附 `code_verifier`（若使用 PKCE）。  
5. 解析 JSON 中的 `access_token`；若 scope 含 `openid`，还有 `id_token`（JWT）。需要长会话时可请求 `offline_access` 并取得 `refresh_token`（须在后台客户端启用 refresh 授权）。可选 `GET userinfo_endpoint`。

**尚未实现（可选增强）**：`/oauth/register` 动态客户端注册、设备授权等扩展流程。

---

## 愿景：统一 SSO / OAuth2，供多站点「一键登录」

目标形态：**本系统作为身份提供方（IdP）**，各业务站点作为 **OAuth2 / OpenID Connect 的客户端（Client / RP）**。用户在本系统登录（或已登录）后，跳转回业务站时携带 **授权码**，业务站用 **Client Secret**（机密客户端）或 **PKCE**（公开客户端）换 **Access Token / ID Token**，从而完成「一键登录」并与本系统账号绑定。

### 与当前能力的关系

- **对本站用户**：仍用 **NextAuth** 登录（邮箱密码 / GitHub / Google），会话为 **JWT**；访问 `/oauth/authorize` 时沿用该会话决定是否已登录。  
- **对第三方站点**：已通过上一节 **自建 OAuth2/OIDC 端点** 对外签发 **授权码与 token**；NextAuth 仍可作为 **联邦登录**（去 GitHub/Google 拉账号），与「本系统当 IdP」并存。  
- **已覆盖**：同意页、Refresh、RS256/JWKS（可选）、吊销、自省、管理后台维护 Client、登出入口；未覆盖动态注册等见上文。

### 推荐技术路线（择一或组合）

1. **在本仓库内自建 OIDC Provider（深度定制）**  
   使用成熟 AS 库（如基于 Node 的 **OIDC Provider** 类方案）挂载到 Next 的 Route Handlers 或独立子域服务，用户与权限仍用现有 LibSQL。工作量大，但品牌与数据完全自控。

2. **外置专用 IdP + 本系统做管理控制台（上线快）**  
   使用 [Keycloak](https://www.keycloak.org/)、[Zitadel](https://zitadel.com/)、[Authentik](https://goauthentik.io/) 等作为授权服务器；本模板演化为 **「账号/应用/权限管理后台」** 通过 IdP Admin API 同步用户，或只做策略与审计。多站 SSO 协议由 IdP 保证，符合「统一 SSO」预期且省协议细节。

3. **混合**  
   短期用外置 IdP 满足各站对接；长期把用户目录与客户端注册逐步收到自研 AS，降低双系统同步成本。

### 第三方站点对接时的大致步骤（目标架构下）

1. 在本系统（或 IdP）**注册 OAuth 客户端**：获得 `client_id` / `client_secret`（或仅 PKCE 的公开客户端），登记允许的 **`redirect_uri` 白名单**。
2. 用户从业务站点击「使用某某账号登录」→ 302 到本系统 **`/authorize?...`**。
3. 用户未登录则在本系统登录；已登录可跳过或只展示 **同意授权** 页。
4. 用户同意后 302 回业务站 `redirect_uri?code=...&state=...`。
5. 业务站 **服务端** 用 `code` 调用 **`/token`**，换 `access_token` +（若 OIDC）`id_token`。
6. 用 `id_token` 解析 `sub`（稳定用户标识）或调用 **`/userinfo`**，在业务站创建/关联本地用户，完成会话。

安全要点：**`state` 防 CSRF**、机密客户端保护 **`client_secret`**、公开客户端强制 **PKCE**、**redirect_uri** 不允许通配符滥用、**Refresh Token** 轮换与吊销策略。

### 建议实施阶段（路线图）

| 阶段 | 内容 | 状态 |
|------|------|------|
| **P0** | 稳定本系统账号体系、HTTPS、固定 `NEXTAUTH_URL` / `OAUTH_ISSUER_URL` | 持续 |
| **P1** | OAuth2 客户端与授权码表；**授权码 + Token**；Discovery；UserInfo；PKCE；机密/公开客户端 | **已落地最小实现**（见上一节） |
| **P2** | 同意页、Refresh、RS256 + `jwks_uri`、吊销 / introspection、管理后台 Client、登出 | **已落地**（细节见 `/docs/oauth2`） |
| **P3** | 设备授权、动态注册、更强 SLO/审计、可选 **SAML 2.0** | 规划 |

若你希望下一步优先 **动态客户端注册** 或 **密钥轮换运维**，可单独开需求拆任务。

---

## 许可与贡献

本仓库为模板项目，可按需 fork 后修改业务与权限模型。若二次分发，请保留适当的版权声明（视你追加的许可证而定）。
