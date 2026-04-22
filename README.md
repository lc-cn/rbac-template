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
| `pnpm run db:apply-sql` | 将 `sql/schema.sql` 应用到 `DATABASE_URL` 指向的库（默认文件路径；可传参：`pnpm run db:apply-sql /path/to.sql`） |
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

---

## 仓库结构（与数据相关）

```
sql/schema.sql              # 建表 + 索引 DDL
scripts/apply-schema-sql.mjs   # 将 SQL 文件批量执行到 DATABASE_URL
scripts/seed.mjs            # 种子数据（Node，读 dotenv）
src/lib/db.ts               # LibSQL 客户端单例、工具函数
src/lib/data-access.ts      # 业务 SQL / 聚合查询
src/lib/next-auth-libsql-adapter.ts  # NextAuth Database Adapter（LibSQL）
```

---

## 许可与贡献

本仓库为模板项目，可按需 fork 后修改业务与权限模型。若二次分发，请保留适当的版权声明（视你追加的许可证而定）。
