import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { hashInvitationToken } from './invitation-token.ts'

describe('invitation-token', () => {
  it('hashInvitationToken is stable for same input', () => {
    const h = hashInvitationToken('abc')
    assert.equal(h, hashInvitationToken('abc'))
    assert.notEqual(h, hashInvitationToken('abd'))
  })
})
