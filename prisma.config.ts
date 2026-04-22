import 'dotenv/config'
import { defineConfig } from 'prisma/config'

/**
 * 统一使用 LibSQL（Turso：`libsql://...` + `DATABASE_AUTH_TOKEN`）。
 * Prisma 7.7 的 schema 引擎仍无法直接对 `libsql://` 执行 `db push`（会报 P1013），
 * 远程库结构同步请用 Turso CLI / `migrate diff` 生成 SQL 后执行，详见 README。
 */
/**
 * 供 Prisma CLI（尤其是 `prisma generate`）读取的 datasource.url。
 * 在 Vercel 安装阶段可能尚未注入 `DATABASE_URL`，此时用占位 libsql URL 仍可生成客户端；
 * 应用与 seed 的真实连接以 `src/lib/prisma.ts`、`prisma/seed.ts` 内的校验为准。
 */
function datasourceUrlForConfig(): string {
  if (process.env.SKIP_DATABASE_URL === '1') {
    return 'libsql://pnpm-install-placeholder.turso.io'
  }
  const url = process.env.DATABASE_URL?.trim()
  if (url?.startsWith('libsql:')) {
    return url
  }
  return 'libsql://prisma-generate-placeholder.turso.io'
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: datasourceUrlForConfig(),
  },
  migrations: {
    seed: 'ts-node --compiler-options {"module":"CommonJS"} prisma/seed.ts',
  },
})
