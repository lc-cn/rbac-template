import { test } from 'node:test'
import assert from 'node:assert/strict'
import { rateLimitBucketStart } from './mfa-rate-limit.ts'

test('rateLimitBucketStart aligns to window', () => {
  assert.equal(rateLimitBucketStart(0, 600), 0)
  assert.equal(rateLimitBucketStart(599, 600), 0)
  assert.equal(rateLimitBucketStart(600, 600), 600)
  assert.equal(rateLimitBucketStart(1200, 600), 1200)
})
