/**
 * 将 Prisma 生成的 SQL 文件应用到 Turso / LibSQL（直连 libsql://，不依赖 Turso CLI 的 api.turso.tech）。
 *
 * 用法：
 *   pnpm run db:print-create-sql > /tmp/schema.sql
 *   pnpm run db:apply-sql /tmp/schema.sql
 *
 * 需在项目根 .env 中配置 DATABASE_URL（libsql://...）与 DATABASE_AUTH_TOKEN。
 */
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@libsql/client'

const file = path.resolve(process.argv[2] || '/tmp/schema.sql')

const url = process.env.DATABASE_URL?.trim()
if (!url?.startsWith('libsql:')) {
  console.error('错误：请在 .env 中设置 DATABASE_URL=libsql://...')
  process.exit(1)
}

const raw = fs.readFileSync(file, 'utf8')
/** 按分号拆分；Prisma migrate diff 的 DDL 通常不含语句内分号 */
const statements = raw
  .replace(/\r\n/g, '\n')
  .split(';')
  .map((s) => s.trim())
  .filter((s) => s.length > 0)

if (statements.length === 0) {
  console.error('错误：SQL 文件为空或无可执行语句：', file)
  process.exit(1)
}

const client = createClient({
  url,
  authToken: process.env.DATABASE_AUTH_TOKEN,
})

try {
  await client.migrate(statements)
  console.log(`已执行 ${statements.length} 条语句（来源：${file}）`)
} finally {
  client.close()
}
