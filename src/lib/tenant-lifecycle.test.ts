import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { resolveTenantLifecycleDisplay } from './tenant-lifecycle-display.ts'

describe('resolveTenantLifecycleDisplay', () => {
  it('returns active when both timestamps null', () => {
    assert.equal(resolveTenantLifecycleDisplay({ suspendedAt: null, archivedAt: null }), 'active')
  })

  it('returns suspended when only suspended set', () => {
    assert.equal(
      resolveTenantLifecycleDisplay({ suspendedAt: '2025-01-01', archivedAt: null }),
      'suspended'
    )
  })

  it('returns archived when archived set', () => {
    assert.equal(
      resolveTenantLifecycleDisplay({ suspendedAt: '2025-01-01', archivedAt: '2025-02-01' }),
      'archived'
    )
  })

  it('archived wins over suspended-only row shape', () => {
    assert.equal(
      resolveTenantLifecycleDisplay({ suspendedAt: null, archivedAt: '2025-02-01' }),
      'archived'
    )
  })

  it('treats null row as active', () => {
    assert.equal(resolveTenantLifecycleDisplay(null), 'active')
  })
})
