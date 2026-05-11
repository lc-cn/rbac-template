/**
 * 租户治理判定（零框架依赖，可单测）。
 * 与 RBAC 业务权限码正交；第一波优先收紧成员与治理高危面（Issue #4）。
 *
 * 与数据层 `TenantRole`（UserTenant.tenantRole）取值一致。
 */
export type TenantGovernanceRole = 'owner' | 'admin' | 'member'

/** HTTP 403 响应体中使用的稳定机器可读码 */
export type GovernanceErrorCode =
  | 'forbidden_not_tenant_member'
  | 'forbidden_governance'
  | 'forbidden_owner_only'
  | 'forbidden_cannot_remove_owner'
  | 'forbidden_invalid_tenant_role'
  | 'forbidden_ownership_transfer_not_supported'

export type GovernanceOk = { ok: true }
export type GovernanceDeny = { ok: false; code: GovernanceErrorCode }

function deny(code: GovernanceErrorCode): GovernanceDeny {
  return { ok: false, code }
}

function allow(): GovernanceOk {
  return { ok: true }
}

export function isOwnerOrAdmin(role: TenantGovernanceRole | null | undefined): boolean {
  return role === 'owner' || role === 'admin'
}

/** 在租户内新增成员（创建用户并写入 UserTenant，或绑定已有用户）。owner / admin。 */
export function canAddMember(actorRole: TenantGovernanceRole | null): GovernanceOk | GovernanceDeny {
  if (!actorRole) return deny('forbidden_not_tenant_member')
  if (isOwnerOrAdmin(actorRole)) return allow()
  return deny('forbidden_governance')
}

/**
 * 从租户移除成员。owner / admin；不可移除 owner 行（不变量：唯一 owner）。
 */
export function canRemoveMember(
  actorRole: TenantGovernanceRole | null,
  targetTenantRole: TenantGovernanceRole
): GovernanceOk | GovernanceDeny {
  if (!actorRole) return deny('forbidden_not_tenant_member')
  if (!isOwnerOrAdmin(actorRole)) return deny('forbidden_governance')
  if (targetTenantRole === 'owner') return deny('forbidden_cannot_remove_owner')
  return allow()
}

/**
 * 租户管理后台内修改他人资料或绑定 RBAC 角色（PUT /api/users/:id 且非本人）。
 * owner / admin。
 */
export function canUpdateOtherUserInTenant(actorRole: TenantGovernanceRole | null): GovernanceOk | GovernanceDeny {
  if (!actorRole) return deny('forbidden_not_tenant_member')
  if (isOwnerOrAdmin(actorRole)) return allow()
  return deny('forbidden_governance')
}

/**
 * 修改 UserTenant.tenantRole（第一波仅支持非 owner 目标上的 admin ↔ member）。
 * - 目标为 owner 行：本期不允许通过通用用户 API 修改（owner 移交另立入口）。
 * - 设为 owner：本期不支持（占位错误码）。
 * - admin ↔ member（目标非 owner）：owner 与 admin。
 */
export function canChangeTenantGovernanceRole(
  actorRole: TenantGovernanceRole | null,
  targetCurrentRole: TenantGovernanceRole,
  nextRole: TenantGovernanceRole
): GovernanceOk | GovernanceDeny {
  if (!actorRole) return deny('forbidden_not_tenant_member')
  if (targetCurrentRole === 'owner') {
    return deny('forbidden_owner_only')
  }
  if (nextRole === 'owner') {
    return deny('forbidden_ownership_transfer_not_supported')
  }
  if (nextRole !== 'admin' && nextRole !== 'member') {
    return deny('forbidden_invalid_tenant_role')
  }
  if (!isOwnerOrAdmin(actorRole)) return deny('forbidden_governance')
  return allow()
}

/** 删除租户等不可恢复操作（API 尚无不命中模块单测占位）。仅 owner。 */
export function canDeleteTenant(actorRole: TenantGovernanceRole | null): GovernanceOk | GovernanceDeny {
  if (!actorRole) return deny('forbidden_not_tenant_member')
  if (actorRole === 'owner') return allow()
  return deny('forbidden_owner_only')
}
