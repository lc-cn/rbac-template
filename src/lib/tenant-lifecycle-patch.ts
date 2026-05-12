/** 与 `/api/tenants/[tenantId]/lifecycle` PATCH body 语义一致（Issue #6 / #18）。 */

export type TenantLifecyclePatch = { suspended?: boolean; archived?: boolean }

export type ParseTenantLifecyclePatchResult =
  | { ok: true; patch: TenantLifecyclePatch }
  | { ok: false; error: string; status: number }

export function parseTenantLifecyclePatchBody(body: unknown): ParseTenantLifecyclePatchResult {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: '请求体无效', status: 400 }
  }
  const rec = body as Record<string, unknown>
  const patch: TenantLifecyclePatch = {}
  if (typeof rec.suspended === 'boolean') patch.suspended = rec.suspended
  if (typeof rec.archived === 'boolean') patch.archived = rec.archived
  if (patch.suspended === undefined && patch.archived === undefined) {
    return { ok: false, error: '缺少 suspended 或 archived', status: 400 }
  }
  return { ok: true, patch }
}

/** 平台管理员侧：不允许解除归档（Issue #18）。 */
export function forbidPlatformTenantUnarchive(patch: TenantLifecyclePatch): ParseTenantLifecyclePatchResult {
  if (patch.archived === false) {
    return { ok: false, error: '平台暂不支持解除归档', status: 403 }
  }
  return { ok: true, patch }
}
