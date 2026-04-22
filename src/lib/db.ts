import { createClient, type Client } from '@libsql/client'

const globalForDb = globalThis as unknown as { libsql?: Client }

export function requireLibsqlUrl(): string {
  const url = process.env.DATABASE_URL?.trim()
  if (!url?.startsWith('libsql:')) {
    throw new Error(
      'DATABASE_URL 未配置或不是 LibSQL（须以 libsql: 开头）。请使用 Turso 等 LibSQL 服务。'
    )
  }
  return url
}

export function getDb(): Client {
  if (globalForDb.libsql) return globalForDb.libsql
  const client = createClient({
    url: requireLibsqlUrl(),
    authToken: process.env.DATABASE_AUTH_TOKEN,
  })
  if (process.env.NODE_ENV !== 'production') globalForDb.libsql = client
  return client
}

export function newId(): string {
  return crypto.randomUUID()
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function boolFromSql(v: unknown): boolean {
  return v === 1 || v === true || v === '1'
}

export function isUniqueConstraintError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e)
  if (/UNIQUE constraint failed|SQLITE_CONSTRAINT_UNIQUE/i.test(msg)) return true
  if (typeof e === 'object' && e !== null && 'code' in e) {
    const c = String((e as { code: unknown }).code)
    if (c.includes('SQLITE_CONSTRAINT_UNIQUE')) return true
  }
  return false
}
