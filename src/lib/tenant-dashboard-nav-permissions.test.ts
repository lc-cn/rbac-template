import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { PermissionCodes } from './permission-codes.ts'
import {
  SIDEBAR_NAV_ACCESS,
  sessionHasTenantRead,
  sidebarTenantLinkVisible,
} from './tenant-dashboard-nav-permissions.ts'

describe('tenant-dashboard-nav-permissions', () => {
  it('shows dashboard and profile without tenant', () => {
    const dash = SIDEBAR_NAV_ACCESS.find((r) => r.href === '/')!
    const profile = SIDEBAR_NAV_ACCESS.find((r) => r.href === '/profile')!
    const s = { currentTenantId: null as string | null, tenantPermissionCodes: null as string[] | null, isPlatformAdmin: false }
    assert.equal(sidebarTenantLinkVisible(dash, s), true)
    assert.equal(sidebarTenantLinkVisible(profile, s), true)
  })

  it('hides tenant read nav without matching permission', () => {
    const users = SIDEBAR_NAV_ACCESS.find((r) => r.href === '/users')!
    const s = {
      currentTenantId: 't1',
      tenantPermissionCodes: ['role:read'],
      isPlatformAdmin: false,
    }
    assert.equal(sidebarTenantLinkVisible(users, s), false)
  })

  it('shows tenant read nav when permission present', () => {
    const users = SIDEBAR_NAV_ACCESS.find((r) => r.href === '/users')!
    const s = {
      currentTenantId: 't1',
      tenantPermissionCodes: [PermissionCodes.USER_READ],
      isPlatformAdmin: false,
    }
    assert.equal(sidebarTenantLinkVisible(users, s), true)
  })

  it('sessionHasTenantRead is true when ENFORCE_RBAC_ON_WRITE=off', () => {
    const prev = process.env.ENFORCE_RBAC_ON_WRITE
    process.env.ENFORCE_RBAC_ON_WRITE = 'off'
    assert.equal(
      sessionHasTenantRead(
        { currentTenantId: null, tenantPermissionCodes: null, isPlatformAdmin: false },
        PermissionCodes.USER_READ
      ),
      true
    )
    process.env.ENFORCE_RBAC_ON_WRITE = prev
  })
})
