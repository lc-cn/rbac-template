import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  forbidPlatformTenantUnarchive,
  parseTenantLifecyclePatchBody,
} from './tenant-lifecycle-patch.ts'

describe('tenant-lifecycle-patch', () => {
  describe('parseTenantLifecyclePatchBody', () => {
    it('accepts suspended only', () => {
      const r = parseTenantLifecyclePatchBody({ suspended: true })
      assert.equal(r.ok, true)
      if (r.ok) assert.deepEqual(r.patch, { suspended: true })
    })
    it('accepts archived only', () => {
      const r = parseTenantLifecyclePatchBody({ archived: false })
      assert.equal(r.ok, true)
      if (r.ok) assert.deepEqual(r.patch, { archived: false })
    })
    it('rejects empty object', () => {
      const r = parseTenantLifecyclePatchBody({})
      assert.equal(r.ok, false)
      if (!r.ok) {
        assert.equal(r.status, 400)
        assert.equal(r.error, '缺少 suspended 或 archived')
      }
    })
    it('rejects non-boolean fields', () => {
      const r = parseTenantLifecyclePatchBody({ suspended: 'yes' })
      assert.equal(r.ok, false)
      if (!r.ok) assert.equal(r.status, 400)
    })
    it('rejects non-object body', () => {
      assert.equal(parseTenantLifecyclePatchBody(null).ok, false)
      assert.equal(parseTenantLifecyclePatchBody([]).ok, false)
    })
  })

  describe('forbidPlatformTenantUnarchive', () => {
    it('allows suspend-only patch', () => {
      const r = forbidPlatformTenantUnarchive({ suspended: true })
      assert.equal(r.ok, true)
    })
    it('denies archived false', () => {
      const r = forbidPlatformTenantUnarchive({ archived: false })
      assert.equal(r.ok, false)
      if (!r.ok) {
        assert.equal(r.status, 403)
        assert.match(r.error, /解除归档/)
      }
    })
    it('allows archived true', () => {
      const r = forbidPlatformTenantUnarchive({ archived: true })
      assert.equal(r.ok, true)
    })
  })
})
