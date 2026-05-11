import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { featureInvitesEnabled, featureOwnerTransferEnabled } from './wave3-env.ts'

describe('wave3-env', () => {
  it('FEATURE_INVITES=off disables invites', () => {
    const prev = process.env.FEATURE_INVITES
    process.env.FEATURE_INVITES = 'off'
    assert.equal(featureInvitesEnabled(), false)
    process.env.FEATURE_INVITES = prev
  })

  it('FEATURE_OWNER_TRANSFER=off disables owner transfer', () => {
    const prev = process.env.FEATURE_OWNER_TRANSFER
    process.env.FEATURE_OWNER_TRANSFER = '0'
    assert.equal(featureOwnerTransferEnabled(), false)
    process.env.FEATURE_OWNER_TRANSFER = prev
  })
})
