import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { enforceTenantRbac } from './rbac-env.ts'

describe('rbac-env', () => {
  it('enforceTenantRbac respects ENFORCE_RBAC_ON_WRITE=off', () => {
    const prev = process.env.ENFORCE_RBAC_ON_WRITE
    process.env.ENFORCE_RBAC_ON_WRITE = 'off'
    assert.equal(enforceTenantRbac(), false)
    process.env.ENFORCE_RBAC_ON_WRITE = prev
  })
})
