import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  applyTenantSwitch,
  normalizeTenantPermissionCodes,
  readTenantPermissionCodesFromToken,
  type TenantClaimsState,
  type TenantMembershipResolver,
} from './auth-token-mutations.ts'

const T_A_STATE: TenantClaimsState = {
  currentTenantId: 'tenant_a',
  tenantRole: 'admin',
  tenantPermissionCodes: ['user:read', 'role:read'],
}

function fixedResolver(map: Record<string, { tenantRole: 'owner' | 'admin' | 'member'; codes: string[] }>): TenantMembershipResolver {
  return async (_userId, tenantId) => {
    const m = map[tenantId]
    if (!m) return null
    return { tenantRole: m.tenantRole, tenantPermissionCodes: m.codes }
  }
}

describe('normalizeTenantPermissionCodes', () => {
  it('dedupes and sorts ascending', () => {
    assert.deepEqual(
      normalizeTenantPermissionCodes(['role:read', 'user:read', 'role:read', 'user:read']),
      ['role:read', 'user:read']
    )
  })

  it('drops empty / non-string entries defensively', () => {
    const input = ['user:read', '', 'role:read', undefined as unknown as string, null as unknown as string]
    assert.deepEqual(normalizeTenantPermissionCodes(input), ['role:read', 'user:read'])
  })
})

describe('readTenantPermissionCodesFromToken', () => {
  it('returns null for null / undefined / non-array', () => {
    assert.equal(readTenantPermissionCodesFromToken(null), null)
    assert.equal(readTenantPermissionCodesFromToken(undefined), null)
    assert.equal(readTenantPermissionCodesFromToken('user:read'), null)
    assert.equal(readTenantPermissionCodesFromToken(42), null)
  })

  it('normalizes arrays through the same dedupe / sort path', () => {
    assert.deepEqual(
      readTenantPermissionCodesFromToken(['user:read', 'role:read', 'user:read', 7 as unknown as string]),
      ['role:read', 'user:read']
    )
  })

  it('returns empty array when array contains only invalid entries', () => {
    assert.deepEqual(readTenantPermissionCodesFromToken([]), [])
    assert.deepEqual(readTenantPermissionCodesFromToken([null, undefined, '']), [])
  })
})

describe('applyTenantSwitch — clearing tenant context (Issue #10 AC2)', () => {
  it('null clears currentTenantId, tenantRole, and tenantPermissionCodes', async () => {
    const next = await applyTenantSwitch(
      T_A_STATE,
      { userId: 'u1', rawTenantId: null },
      fixedResolver({ tenant_a: { tenantRole: 'admin', codes: ['user:read'] } })
    )
    assert.deepEqual(next, {
      currentTenantId: null,
      tenantRole: null,
      tenantPermissionCodes: null,
    })
  })

  it('undefined and empty string also clear (parity with null)', async () => {
    const r = fixedResolver({})
    for (const raw of [undefined, '', '   ']) {
      const next = await applyTenantSwitch(T_A_STATE, { userId: 'u1', rawTenantId: raw }, r)
      assert.equal(next.currentTenantId, null, `rawTenantId=${JSON.stringify(raw)}`)
      assert.equal(next.tenantRole, null)
      assert.equal(next.tenantPermissionCodes, null)
    }
  })
})

describe('applyTenantSwitch — switching tenant refreshes RBAC (Issue #10 AC1)', () => {
  it('writes new currentTenantId / tenantRole and re-resolves tenantPermissionCodes for the target tenant', async () => {
    const resolver = fixedResolver({
      tenant_b: { tenantRole: 'member', codes: ['perm:read', 'feature:read', 'perm:read'] },
    })
    const next = await applyTenantSwitch(T_A_STATE, { userId: 'u1', rawTenantId: 'tenant_b' }, resolver)
    assert.equal(next.currentTenantId, 'tenant_b')
    assert.equal(next.tenantRole, 'member')
    // Sorted + de-duped per normalizeTenantPermissionCodes
    assert.deepEqual(next.tenantPermissionCodes, ['feature:read', 'perm:read'])
  })

  it('does not retain prior tenant codes when target has empty permission set', async () => {
    const resolver = fixedResolver({
      tenant_c: { tenantRole: 'member', codes: [] },
    })
    const next = await applyTenantSwitch(T_A_STATE, { userId: 'u1', rawTenantId: 'tenant_c' }, resolver)
    assert.equal(next.currentTenantId, 'tenant_c')
    assert.equal(next.tenantRole, 'member')
    assert.deepEqual(next.tenantPermissionCodes, [])
  })

  it('passes the target tenantId (trimmed) to the resolver, not the raw input', async () => {
    let seenUser = ''
    let seenTenant = ''
    const resolver: TenantMembershipResolver = async (uid, tid) => {
      seenUser = uid
      seenTenant = tid
      return { tenantRole: 'admin', tenantPermissionCodes: ['x:y'] }
    }
    await applyTenantSwitch(T_A_STATE, { userId: 'u1', rawTenantId: '  tenant_d  ' }, resolver)
    assert.equal(seenUser, 'u1')
    assert.equal(seenTenant, 'tenant_d')
  })
})

describe('applyTenantSwitch — non-member preserves prior state', () => {
  it('keeps current claims when resolver returns null (target not a member)', async () => {
    const resolver = fixedResolver({})
    const next = await applyTenantSwitch(T_A_STATE, { userId: 'u1', rawTenantId: 'tenant_x' }, resolver)
    assert.deepEqual(next, T_A_STATE)
  })

  it('returns unchanged state when userId is empty (defensive)', async () => {
    const resolver = fixedResolver({ tenant_b: { tenantRole: 'admin', codes: ['x:y'] } })
    const next = await applyTenantSwitch(T_A_STATE, { userId: '', rawTenantId: 'tenant_b' }, resolver)
    assert.deepEqual(next, T_A_STATE)
  })
})

describe('applyTenantSwitch — platform-only / no-tenant baseline (Issue #10 AC2)', () => {
  it('a session without currentTenantId never gains tenant RBAC by re-running with null', async () => {
    const platformOnly: TenantClaimsState = {
      currentTenantId: null,
      tenantRole: null,
      tenantPermissionCodes: null,
    }
    const next = await applyTenantSwitch(
      platformOnly,
      { userId: 'platform_admin', rawTenantId: null },
      fixedResolver({ tenant_a: { tenantRole: 'admin', codes: ['user:read'] } })
    )
    assert.equal(next.currentTenantId, null)
    assert.equal(next.tenantRole, null)
    assert.equal(next.tenantPermissionCodes, null)
  })

  it('switching from no-tenant to a member tenant injects only that tenant‘s codes', async () => {
    const platformOnly: TenantClaimsState = {
      currentTenantId: null,
      tenantRole: null,
      tenantPermissionCodes: null,
    }
    const resolver = fixedResolver({
      tenant_b: { tenantRole: 'admin', codes: ['user:read', 'role:read'] },
    })
    const next = await applyTenantSwitch(platformOnly, { userId: 'u', rawTenantId: 'tenant_b' }, resolver)
    assert.equal(next.currentTenantId, 'tenant_b')
    assert.equal(next.tenantRole, 'admin')
    assert.deepEqual(next.tenantPermissionCodes, ['role:read', 'user:read'])
  })
})
