import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { redirectPathWhenMissingCurrentTenant } from './organizations-current-redirect.ts'

describe('organizations-current redirect (Issue #15)', () => {
  it('sends non–platform admins to /no-tenant', () => {
    assert.equal(redirectPathWhenMissingCurrentTenant(false), '/no-tenant')
  })

  it('sends platform admins to /', () => {
    assert.equal(redirectPathWhenMissingCurrentTenant(true), '/')
  })
})
