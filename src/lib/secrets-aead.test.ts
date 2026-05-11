import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sealSecret, openSecret } from './secrets-aead.ts'

test('secrets AEAD roundtrip', async () => {
  process.env.SECRETS_ENCRYPTION_KEY = 'c'.repeat(64)
  const plain = 'hello-世界'
  const enc = sealSecret(plain, 'aad1')
  const out = openSecret(enc, 'aad1')
  assert.equal(out, plain)
})

test('wrong AAD fails openSecret', async () => {
  process.env.SECRETS_ENCRYPTION_KEY = 'd'.repeat(64)
  const enc = sealSecret('x', 'good')
  assert.throws(() => openSecret(enc, 'bad'))
})
