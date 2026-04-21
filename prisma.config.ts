import { defineConfig } from 'prisma/config'

/** Migrate / introspect 等 CLI 使用的连接串；与 src/lib/prisma.ts 运行时默认保持一致 */
const defaultDatabaseUrl = 'file:./dev.db'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed:
      'ts-node --compiler-options {"module":"CommonJS"} prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? defaultDatabaseUrl,
  },
})
