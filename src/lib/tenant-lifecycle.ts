import { getDb } from '@/lib/db'

export type TenantLifecycleRow = {
  suspendedAt: string | null
  archivedAt: string | null
}

export async function getTenantLifecycle(tenantId: string): Promise<TenantLifecycleRow | null> {
  const db = getDb()
  const r = await db.execute({
    sql: `SELECT "suspendedAt", "archivedAt" FROM "Tenant" WHERE "id" = ?`,
    args: [tenantId],
  })
  const row = r.rows[0] as unknown as Record<string, unknown> | undefined
  if (!row) return null
  return {
    suspendedAt: row.suspendedAt == null ? null : String(row.suspendedAt),
    archivedAt: row.archivedAt == null ? null : String(row.archivedAt),
  }
}

/** 租户处于暂停或归档时，禁止控制台/API 变更类操作（只读模式）。 */
export async function tenantLifecycleBlocksMutations(tenantId: string): Promise<boolean> {
  const life = await getTenantLifecycle(tenantId)
  if (!life) return true
  return !!(life.suspendedAt || life.archivedAt)
}

/** 归档租户不得签发新的 OAuth 授权码 / access token / refresh 轮换（Issue #6）。 */
export async function tenantArchivedBlocksOAuthIssuance(tenantId: string): Promise<boolean> {
  const life = await getTenantLifecycle(tenantId)
  if (!life) return true
  return !!life.archivedAt
}
