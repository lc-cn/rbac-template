import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hashBackupCode, normalizeBackupCodeInput } from './mfa-backup-codes.ts'

test('normalizeBackupCodeInput uppercases and trims', () => {
  assert.equal(normalizeBackupCodeInput('  ab12  '), 'AB12')
})

test('hashBackupCode is stable for same inputs', () => {
  const a = hashBackupCode('ABCDEFGHJKLMNPQR', 'user1', 'salt1')
  const b = hashBackupCode('abcdefghjklmnpqr', 'user1', 'salt1')
  assert.equal(a, b)
})

test('hashBackupCode differs by user', () => {
  const a = hashBackupCode('ABCDEFGHJKLMNPQR', 'user1', 'salt1')
  const b = hashBackupCode('ABCDEFGHJKLMNPQR', 'user2', 'salt1')
  assert.notEqual(a, b)
})
