# RBAC Template

基于 Next.js 16 App Router、**@libsql/client**（直连 SQL）、Tailwind CSS 和 shadcn/ui 构建的全栈 RBAC（基于角色的访问控制）管理系统。

## 功能

- 用户管理（CRUD + 多角色分配）
- 角色管理（CRUD + 权限分配）
- 权限管理（按应用分组）
- 应用 / 功能模块管理
- 系统配置（通用 k/v + OAuth2 提供商，与登录页联动）
- 登录（邮箱密码 + 已启用的 GitHub / Google OAuth2）

## 技术栈

- **框架**：Next.js 16 App Router
- **数据库**：[Turso](https://turso.tech) / LibSQL（[`@libsql/client`](https://github.com/tursodatabase/libsql-client-ts) 手写 SQL + 轻量 DAL）
- **UI**：Tailwind CSS v4 + shadcn/ui

## 快速开始（本地开发）

```bash
# 1. 安装依赖
pnpm install

# 2. 复制环境变量并填入 Turso 的 DATABASE_URL / DATABASE_AUTH_TOKEN
cp .env.example .env
# 按需再复制一份给 Next：cp .env .env.local

# 3. 若为 Turso **空库**：应用仓库内建表 SQL（已建表可跳过；见下文「数据库与 Schema」）
pnpm run db:apply-sql

# 4. 写入种子数据（需已配置 .env 中的 DATABASE_URL / DATABASE_AUTH_TOKEN）
pnpm run seed

# 5. 启动开发服务器
pnpm dev
```

复制环境变量后，请按需编辑 `.env.local`：**数据库**已统一为 **LibSQL（`libsql://`）**，须配置 `DATABASE_URL` 与（Turso 等远程场景下的）`DATABASE_AUTH_TOKEN`；**登录 / OAuth** 建议填写 `NEXTAUTH_URL`、`NEXTAUTH_SECRET`。

打开 [http://localhost:3000](http://localhost:3000) 会进入登录页。默认管理员账号：

| 邮箱 | 密码 |
|---|---|
| admin@example.com | admin123 |

### OAuth2（系统配置）

此前「OAuth2 登录配置」仅写入数据库，未接入认证流程。现在登录接口使用 **NextAuth**，并在每次请求时读取已 **启用** 且 **Client ID/Secret 非占位符** 的提供商记录：

- **类型为 `github` / `google`**：登录页会出现对应按钮；请在第三方开发者控制台将回调 URL 配置为 `{NEXTAUTH_URL}/api/auth/callback/github` 或 `.../callback/google`。
- **微信、钉钉、飞书、`custom` 等**：尚未在 NextAuth 中接入，保存后不会影响登录页（需后续单独开发 Provider）。

本地建议在 `.env.local` 中显式设置 `NEXTAUTH_URL`（如 `http://localhost:3000`）与 `NEXTAUTH_SECRET`（生产务必使用强随机值）。未设置密钥时本地会使用代码内置开发回退值，**禁止用于公网**。

## 部署到 Vercel

SQLite 文件在 Vercel Serverless 环境中**无法持久化**，需要使用 [Turso](https://turso.tech) 作为生产数据库。

### 第一步：创建 Turso 数据库

```bash
# 安装 Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# 登录
turso auth login

# 创建数据库
turso db create rbac-template

# 获取数据库 URL
turso db show rbac-template --url
# 输出类似：libsql://rbac-template-<username>.turso.io

# 生成访问令牌
turso db tokens create rbac-template
# 输出一个长字符串令牌
```

### 第二步：在 Turso 上应用 Schema

空库在项目根执行（使用 `.env` 或当前 shell 中的 `DATABASE_URL` / `DATABASE_AUTH_TOKEN`）：

```bash
export DATABASE_URL="libsql://rbac-template-<username>.turso.io"
export DATABASE_AUTH_TOKEN="<your-token>"
pnpm run db:apply-sql
```

### 第三步：在 Vercel 配置环境变量

在 Vercel 项目的 **Settings → Environment Variables** 中添加以下变量（生产环境建议对 **Production** 环境单独勾选）：

| 变量名 | 必填 | 说明 |
|---|---|---|
| `DATABASE_URL` | 是 | Turso 数据库地址，如 `libsql://rbac-template-<username>.turso.io` |
| `DATABASE_AUTH_TOKEN` | 是 | Turso 访问令牌（`turso db tokens create`） |
| `NEXTAUTH_URL` | 强烈建议 | 站点根 URL，如 `https://<your-project>.vercel.app` 或自定义域名，**须含 `https://`**，无末尾斜杠 |
| `NEXTAUTH_SECRET` | 是 | 随机密钥，用于会话签名；可用 `openssl rand -base64 32` 生成。也可用 `AUTH_SECRET`（二选一，同时存在时优先 `NEXTAUTH_SECRET`） |

未设置 `NEXTAUTH_URL` 时，部分 OAuth 提供商在 Vercel 上可能因回调地址不一致而失败；部署自定义域名后请同步修改该变量。

**Vercel 构建说明**：`pnpm run build` 不再依赖 Prisma；`DATABASE_URL` / `DATABASE_AUTH_TOKEN` 须在 Vercel 环境变量中配置（含 **Build** 环境），供服务端渲染与 API 连接 Turso。首页为动态渲染（`force-dynamic`），空库不会在构建阶段因查表失败而中断。

### 第四步：部署

```bash
vercel deploy
```

或将代码推送到 GitHub 后，在 Vercel 控制台导入仓库，Vercel 会自动完成构建和部署。

## 数据库与 Schema（LibSQL）

模板已**统一为 LibSQL 连接串**（推荐 [Turso](https://turso.tech)）：`DATABASE_URL` 须为 **`libsql://...`**，不再使用本地 `file:./dev.db` 作为默认库。建表 DDL 位于仓库根目录 **`sql/schema.sql`**。

**空库**应用到 Turso：

```bash
# 方式 A：脚本直连 libsql://（本机无法访问 api.turso.tech 时推荐）
pnpm run db:apply-sql

# 方式 B：Turso CLI（需能解析 api.turso.tech）
turso db shell <你的数据库名> < sql/schema.sql
```

若 `turso db shell` 报错 `lookup api.turso.tech: no such host`，属于 **DNS/网络** 无法访问 Turso 控制面；可换 DNS/VPN 排查，或直接使用 **`pnpm run db:apply-sql`**。

**已有数据**的库请自行编写增量 SQL（勿对非空库盲目执行仓库内全量 `CREATE TABLE`）。

## 环境变量说明

NextAuth 使用 `NEXTAUTH_*`（或 `AUTH_SECRET`）。字段级说明如下；**完整注释版模板**见 [`.env.example`](.env.example)。

| 变量名 | 谁读取 | 必填 | 默认 / 回退 | 说明 |
|---|---|---|---|---|
| `DATABASE_URL` | Next.js、`db:apply-sql`、`seed` | **是** | — | **必须为 `libsql://...`**（Turso 等）。 |
| `DATABASE_AUTH_TOKEN` | Next.js、`db:apply-sql`、`seed` | Turso 等远程时 **是** | — | LibSQL 远程访问令牌。 |
| `NEXTAUTH_URL` | NextAuth、中间件 | 本地可选；**生产 / OAuth 强烈建议** | — | 对外的站点根 URL（含协议，**无末尾斜杠**），如 `http://localhost:3000` 或 `https://your-domain.com`。影响 OAuth 回调校验与重定向；Vercel 上未设易导致第三方登录失败。 |
| `NEXTAUTH_SECRET` | NextAuth、中间件 | **生产必填**；本地可省略 | 开发用固定回退字符串 | 会话与 JWT 签名密钥。可用 `openssl rand -base64 32` 生成。 |
| `AUTH_SECRET` | NextAuth、中间件 | 否 | 同左，与 `NEXTAUTH_SECRET` 二选一 | 与 `NEXTAUTH_SECRET` 等价；**同时存在时优先使用 `NEXTAUTH_SECRET`**。 |

**OAuth 回调地址**（在 GitHub / Google 开发者控制台配置）：

- `{NEXTAUTH_URL}/api/auth/callback/github`
- `{NEXTAUTH_URL}/api/auth/callback/google`

将 `{NEXTAUTH_URL}` 替换为你在上表中配置的实际根地址（勿带末尾 `/`）。

