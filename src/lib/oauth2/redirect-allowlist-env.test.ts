import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'
import {
  oauthAuthorizeRedirectUriAllowlist,
  oauthPostLogoutRedirectUriAllowlist,
  parseEnvRedirectUriList,
} from './redirect-allowlist-env.ts'

function redirectUriAllowed(redirectUri: string, uris: string[]): boolean {
  return uris.some((u) => u === redirectUri)
}

describe('parseEnvRedirectUriList', () => {
  it('splits on comma and newline', () => {
    assert.deepEqual(parseEnvRedirectUriList('a,b\nc'), ['a', 'b', 'c'])
  })

  it('trims and skips empty', () => {
    assert.deepEqual(parseEnvRedirectUriList('  x  ,\n  '), ['x'])
  })

  it('returns empty for undefined', () => {
    assert.deepEqual(parseEnvRedirectUriList(undefined), [])
  })
})

describe('oauth redirect allowlist env merge', () => {
  afterEach(() => {
    delete process.env.OIDC_EXTRA_REDIRECT_URIS
    delete process.env.OIDC_EXTRA_POST_LOGOUT_REDIRECT_URIS
  })

  it('merges OIDC_EXTRA_REDIRECT_URIS for authorize allowlist', () => {
    process.env.OIDC_EXTRA_REDIRECT_URIS = 'https://extra.example/cb'
    const merged = oauthAuthorizeRedirectUriAllowlist(['https://db.example/cb'])
    assert.ok(redirectUriAllowed('https://db.example/cb', merged))
    assert.ok(redirectUriAllowed('https://extra.example/cb', merged))
  })

  it('merges OIDC_EXTRA_POST_LOGOUT_REDIRECT_URIS for post-logout allowlist', () => {
    process.env.OIDC_EXTRA_POST_LOGOUT_REDIRECT_URIS = 'https://extra.example/'
    const merged = oauthPostLogoutRedirectUriAllowlist(['https://db.example/'])
    assert.ok(redirectUriAllowed('https://db.example/', merged))
    assert.ok(redirectUriAllowed('https://extra.example/', merged))
  })
})
