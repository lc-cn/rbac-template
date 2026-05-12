/**
 * 将 SQL DDL 文件应用到 Turso / LibSQL（直连 libsql://，不依赖 Turso CLI 的 api.turso.tech）。
 *
 * 用法：
 *   pnpm run db:apply-sql
 *   pnpm run db:apply-sql path/to/schema.sql
 *
 * 需在项目根 `.env.local` 或 `.env` 中配置 DATABASE_URL（libsql://...）与 DATABASE_AUTH_TOKEN。
 */
import './dotenv-config.mjs'
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@libsql/client'

const file = path.resolve(process.argv[2] || 'sql/schema.sql')

const url = process.env.DATABASE_URL?.trim()
if (!url?.startsWith('libsql:')) {
  console.error('错误：请在根目录 .env.local 或 .env 中设置 DATABASE_URL=libsql://...')
  process.exit(1)
}

const raw = fs.readFileSync(file, 'utf8')
/** 按分号拆分语句（语句内勿使用未转义的分号） */
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

/** 002 建出的 OAuth2Client 无 applicationId；IF NOT EXISTS 不会改表结构，建索引会报 no such column */
async function dropLegacyOAuth2ClientIfApplyingSchema() {
  if (path.basename(file).toLowerCase() !== 'schema.sql') return
  const tbl = await client.execute({
    sql: `SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'OAuth2Client'`,
    args: [],
  })
  if (!tbl.rows[0]) return
  const col = await client.execute({
    sql: `SELECT 1 FROM pragma_table_info('OAuth2Client') WHERE name = 'applicationId' LIMIT 1`,
    args: [],
  })
  if (col.rows[0]) return
  console.warn(
    '检测到旧版 OAuth2Client（无 applicationId）。将 DROP 后由 schema 重建；库内 IdP 客户端配置会清空，请重新配置或执行 seed。'
  )
  await client.execute({ sql: 'DROP TABLE IF EXISTS "OAuth2Client"', args: [] })
}

try {
  await dropLegacyOAuth2ClientIfApplyingSchema()
  // 使用 execute 而非 migrate：migrate 会把每条语句记入迁移日志，且对已建库重复跑 schema 易与「表已存在」冲突。
  for (const sql of statements) {
    await client.execute({ sql, args: [] })
  }
  console.log(`已执行 ${statements.length} 条语句（来源：${file}）`)
} finally {
  client.close()
}
