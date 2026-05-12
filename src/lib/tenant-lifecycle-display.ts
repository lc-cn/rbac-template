export type TenantLifecycleDisplay = 'active' | 'suspended' | 'archived'

export type TenantLifecycleTimestamps = {
  suspendedAt: string | null
  archivedAt: string | null
}

/** 归档优先于暂停；与 `Tenant` 上 `suspendedAt` / `archivedAt` 语义一致。 */
export function resolveTenantLifecycleDisplay(row: TenantLifecycleTimestamps | null): TenantLifecycleDisplay {
  if (!row) return 'active'
  if (row.archivedAt) return 'archived'
  if (row.suspendedAt) return 'suspended'
  return 'active'
}
