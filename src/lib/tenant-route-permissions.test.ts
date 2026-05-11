import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { PermissionCodes } from './permission-codes.ts'
import { TENANT_ROUTE_PERMISSION_AUDIT } from './tenant-route-permissions.ts'

describe('tenant-route-permissions audit', () => {
  it('every mapped permission exists on PermissionCodes', () => {
    const vals = new Set<string>(Object.values(PermissionCodes))
    for (const row of TENANT_ROUTE_PERMISSION_AUDIT) {
      assert.ok(vals.has(row.permission), `missing code: ${row.permission}`)
    }
  })
})
