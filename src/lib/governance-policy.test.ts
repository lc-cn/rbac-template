import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  canAddMember,
  canChangeTenantGovernanceRole,
  canDeleteTenant,
  canRemoveMember,
  canUpdateOtherUserInTenant,
} from './governance-policy.ts'

describe('governance-policy', () => {
  describe('canAddMember', () => {
    it('allows owner and admin', () => {
      assert.equal(canAddMember('owner').ok, true)
      assert.equal(canAddMember('admin').ok, true)
    })
    it('denies member', () => {
      const r = canAddMember('member')
      assert.equal(r.ok, false)
      if (!r.ok) assert.equal(r.code, 'forbidden_governance')
    })
    it('denies null', () => {
      const r = canAddMember(null)
      assert.equal(r.ok, false)
      if (!r.ok) assert.equal(r.code, 'forbidden_not_tenant_member')
    })
  })

  describe('canRemoveMember', () => {
    it('allows owner/admin removing admin or member', () => {
      assert.equal(canRemoveMember('owner', 'admin').ok, true)
      assert.equal(canRemoveMember('admin', 'member').ok, true)
    })
    it('denies removing owner', () => {
      const r = canRemoveMember('owner', 'owner')
      assert.equal(r.ok, false)
      if (!r.ok) assert.equal(r.code, 'forbidden_cannot_remove_owner')
      const r2 = canRemoveMember('admin', 'owner')
      assert.equal(r2.ok, false)
      if (!r2.ok) assert.equal(r2.code, 'forbidden_cannot_remove_owner')
    })
    it('denies member', () => {
      const r = canRemoveMember('member', 'member')
      assert.equal(r.ok, false)
      if (!r.ok) assert.equal(r.code, 'forbidden_governance')
    })
  })

  describe('canUpdateOtherUserInTenant', () => {
    it('allows owner/admin', () => {
      assert.equal(canUpdateOtherUserInTenant('owner').ok, true)
      assert.equal(canUpdateOtherUserInTenant('admin').ok, true)
    })
    it('denies member', () => {
      const r = canUpdateOtherUserInTenant('member')
      assert.equal(r.ok, false)
      if (!r.ok) assert.equal(r.code, 'forbidden_governance')
    })
  })

  describe('canChangeTenantGovernanceRole', () => {
    it('allows owner/admin to toggle admin/member on non-owner', () => {
      assert.equal(canChangeTenantGovernanceRole('owner', 'member', 'admin').ok, true)
      assert.equal(canChangeTenantGovernanceRole('admin', 'admin', 'member').ok, true)
    })
    it('denies changing owner row', () => {
      const r = canChangeTenantGovernanceRole('owner', 'owner', 'admin')
      assert.equal(r.ok, false)
      if (!r.ok) assert.equal(r.code, 'forbidden_owner_only')
    })
    it('denies promoting to owner via this action', () => {
      const r = canChangeTenantGovernanceRole('owner', 'member', 'owner')
      assert.equal(r.ok, false)
      if (!r.ok) assert.equal(r.code, 'forbidden_ownership_transfer_not_supported')
    })
    it('denies member', () => {
      const r = canChangeTenantGovernanceRole('member', 'member', 'admin')
      assert.equal(r.ok, false)
      if (!r.ok) assert.equal(r.code, 'forbidden_governance')
    })
  })

  describe('canDeleteTenant', () => {
    it('allows only owner', () => {
      assert.equal(canDeleteTenant('owner').ok, true)
      const a = canDeleteTenant('admin')
      assert.equal(a.ok, false)
      if (!a.ok) assert.equal(a.code, 'forbidden_owner_only')
    })
  })
})
