import type { TenantRole } from '@/lib/data-access'

/**
 * 当前 JWT 中与租户 RBAC 相关的字段子集。`null` 语义表示「无当前租户」/「无租户 RBAC」，
 * 与 `isPlatformAdmin` 平台只读会话语义保持一致。
 */
export type TenantClaimsState = {
  currentTenantId: string | null
  tenantRole: TenantRole | null
  tenantPermissionCodes: string[] | null
}

/** 切换租户时的成员/权限解析结果。`null` 代表「不是该租户成员」。 */
export type TenantMembershipSnapshot = {
  tenantRole: TenantRole
  tenantPermissionCodes: string[]
}

export type TenantMembershipResolver = (
  userId: string,
  tenantId: string
) => Promise<TenantMembershipSnapshot | null>

/** 输入侧的「目标租户 id」可能是任意值（来自客户端 `update({ currentTenantId })`）。 */
export type TenantSwitchInput = {
  userId: string
  rawTenantId: unknown
}

/**
 * Issue #10：将 `update({ currentTenantId })` 的客户端意图解释为下一份 JWT 租户声明。
 *
 * 行为契约：
 * - `rawTenantId` 为 `null` / `undefined` / 空字符串：**清空** 租户上下文（`currentTenantId`、`tenantRole`、
 *   `tenantPermissionCodes` 同时为 `null`），避免「无租户上下文」却仍携带前一租户的 RBAC 权限。
 * - `rawTenantId` 解析后非空，`resolve` 返回成员关系：写入新的 `currentTenantId` / `tenantRole`，
 *   并 **重新解析** 该租户下的有效 `tenantPermissionCodes`，避免跨租户串用。
 * - `rawTenantId` 解析后非空，`resolve` 返回 `null`（非成员）：保留先前 `current`，
 *   不做任何替换（与既有 `getUserTenantMembership` 校验失败时的行为一致）。
 *
 * 该函数为纯函数（副作用全部由注入的 `resolve` 承担），便于在 `node:test` 下脱离数据库进行单测。
 */
export async function applyTenantSwitch(
  current: TenantClaimsState,
  input: TenantSwitchInput,
  resolve: TenantMembershipResolver
): Promise<TenantClaimsState> {
  const { userId } = input
  if (!userId) return current

  const raw = input.rawTenantId
  if (raw === null || raw === undefined || raw === '') {
    return { currentTenantId: null, tenantRole: null, tenantPermissionCodes: null }
  }

  const tenantId = String(raw).trim()
  if (!tenantId) {
    return { currentTenantId: null, tenantRole: null, tenantPermissionCodes: null }
  }

  const snapshot = await resolve(userId, tenantId)
  if (!snapshot) return current

  return {
    currentTenantId: tenantId,
    tenantRole: snapshot.tenantRole,
    tenantPermissionCodes: normalizeTenantPermissionCodes(snapshot.tenantPermissionCodes),
  }
}

/** 去重 + 升序排序，确保 JWT 体积稳定且便于做 diff 比较。 */
export function normalizeTenantPermissionCodes(codes: readonly string[]): string[] {
  const set = new Set<string>()
  for (const c of codes) {
    if (typeof c === 'string' && c.length > 0) set.add(c)
  }
  return Array.from(set).sort()
}

/**
 * 从 JWT token 上读取 `tenantPermissionCodes`，做防御性归一化。
 * 旧 JWT（升级前）可能没有此字段；非数组值视为「未知」并返回 `null`。
 */
export function readTenantPermissionCodesFromToken(value: unknown): string[] | null {
  if (value === null || value === undefined) return null
  if (!Array.isArray(value)) return null
  const codes = value.filter((c): c is string => typeof c === 'string' && c.length > 0)
  return normalizeTenantPermissionCodes(codes)
}
