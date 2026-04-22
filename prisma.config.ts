import 'dotenv/config'
import { defineConfig } from 'prisma/config'

/**
 * 统一使用 LibSQL（Turso：`libsql://...` + `DATABASE_AUTH_TOKEN`）。
 * Prisma 7.7 的 schema 引擎仍无法直接对 `libsql://` 执行 `db push`（会报 P1013），
 * 远程库结构同步请用 Turso CLI / `migrate diff` 生成 SQL 后执行，详见 README。
 */
function requireLibsqlDatabaseUrl(): string {
  if (process.env.SKIP_DATABASE_URL === '1') {
    return 'libsql://pnpm-install-placeholder.turso.io'
  }
  const url = process.env.DATABASE_URL?.trim()
  if (!url) {
    throw new Error(
      '缺少 DATABASE_URL。请在根目录 .env 中配置 Turso 地址（libsql://...）与 DATABASE_AUTH_TOKEN；若仅安装依赖尚未配置，可临时使用 SKIP_DATABASE_URL=1 pnpm install（见 README）。'
    )
  }
  if (!url.startsWith('libsql:')) {
    throw new Error('DATABASE_URL 必须为 LibSQL / Turso 连接串（以 libsql: 开头）。')
  }
  return url
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: requireLibsqlDatabaseUrl(),
  },
  migrations: {
    seed: 'ts-node --compiler-options {"module":"CommonJS"} prisma/seed.ts',
  },
})
