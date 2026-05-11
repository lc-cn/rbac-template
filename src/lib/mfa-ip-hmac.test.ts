import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mfaRateLimitIpKey } from './mfa-ip-hmac.ts'

test('mfaRateLimitIpKey is deterministic with pepper', () => {
  process.env.RATE_LIMIT_PEPPER = 'a'.repeat(64)
  const a = mfaRateLimitIpKey('203.0.113.1')
  const b = mfaRateLimitIpKey('203.0.113.1')
  assert.equal(a, b)
  assert.ok(a.startsWith('mfa:ip:'))
})
