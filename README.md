# RBAC Template

基于 Next.js 14 App Router、Prisma、Tailwind CSS 和 shadcn/ui 构建的全栈 RBAC（基于角色的访问控制）管理系统。

## 功能

- 用户管理（CRUD + 多角色分配）
- 角色管理（CRUD + 权限分配）
- 权限管理（按应用分组）
- 应用 / 功能模块管理
- 系统配置（通用 k/v + OAuth2 提供商，与登录页联动）
- 登录（邮箱密码 + 已启用的 GitHub / Google OAuth2）

## 技术栈

- **框架**：Next.js 16 App Router
- **数据库 ORM**：Prisma 7（驱动适配器模式）
- **本地数据库**：SQLite（via `@libsql/client` 文件模式）
- **生产数据库**：[Turso](https://turso.tech)（LibSQL，兼容 Vercel Serverless）
- **UI**：Tailwind CSS v4 + shadcn/ui

## 快速开始（本地开发）

```bash
# 1. 安装依赖
pnpm install

# 2. 复制环境变量文件
cp .env.example .env.local

# 3. 初始化数据库并写入种子数据
pnpm dlx prisma db push
pnpm dlx prisma db seed

# 4. 启动开发服务器
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000) 会进入登录页。默认管理员账号：

| 邮箱 | 密码 |
|---|---|
| admin@example.com | admin123 |

### OAuth2（系统配置）

此前「OAuth2 登录配置」仅写入数据库，未接入认证流程。现在登录接口使用 **NextAuth**，并在每次请求时读取已 **启用** 且 **Client ID/Secret 非占位符** 的提供商记录：

- **类型为 `github` / `google`**：登录页会出现对应按钮；请在第三方开发者控制台将回调 URL 配置为 `{NEXTAUTH_URL}/api/auth/callback/github` 或 `.../callback/google`。
- **微信、钉钉、飞书、`custom` 等**：尚未在 NextAuth 中接入，保存后不会影响登录页（需后续单独开发 Provider）。

建议在 `.env.local` 中设置 `NEXTAUTH_URL`（如 `http://localhost:3000`）与 `NEXTAUTH_SECRET`（生产环境务必使用强随机值）。未设置时本地会使用内置回退密钥，**不可用于公网**。

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

### 第二步：推送数据库 Schema

```bash
# 设置环境变量后推送 schema
DATABASE_URL="libsql://rbac-template-<username>.turso.io" \
DATABASE_AUTH_TOKEN="<your-token>" \
pnpm dlx prisma db push
```

### 第三步：在 Vercel 配置环境变量

在 Vercel 项目的 **Settings → Environment Variables** 中添加以下变量：

| 变量名 | 值 | 说明 |
|---|---|---|
| `DATABASE_URL` | `libsql://rbac-template-<username>.turso.io` | Turso 数据库地址 |
| `DATABASE_AUTH_TOKEN` | `<your-token>` | Turso 访问令牌 |

### 第四步：部署

```bash
vercel deploy
```

或将代码推送到 GitHub 后，在 Vercel 控制台导入仓库，Vercel 会自动完成构建和部署。

## 环境变量说明

| 变量名 | 必填 | 默认值 | 说明 |
|---|---|---|---|
| `DATABASE_URL` | 否 | `file:./dev.db` | 数据库连接地址 |
| `DATABASE_AUTH_TOKEN` | 否（Turso 必填）| — | Turso 数据库访问令牌 |

完整示例见 [`.env.example`](.env.example)。

