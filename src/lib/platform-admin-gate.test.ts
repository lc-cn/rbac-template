import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { AppSession } from '../types/session.ts'
import { checkPlatformAdminApiAccess } from './platform-admin-gate.ts'

function session(partial: Partial<AppSession> & { user: { id: string } }): AppSession {
  return partial as AppSession
}

describe('checkPlatformAdminApiAccess', () => {
  it('401 when not logged in', () => {
    const g = checkPlatformAdminApiAccess(null)
    assert.equal(g.ok, false)
    if (!g.ok) {
      assert.equal(g.status, 401)
      assert.equal(g.error, '未登录')
    }
  })
  it('403 when mfa pending', () => {
    const g = checkPlatformAdminApiAccess(
      session({ user: { id: 'u1' }, mfaPending: true, isPlatformAdmin: true })
    )
    assert.equal(g.ok, false)
    if (!g.ok) assert.equal(g.status, 403)
  })
  it('403 when not platform admin', () => {
    const g = checkPlatformAdminApiAccess(session({ user: { id: 'u1' }, isPlatformAdmin: false }))
    assert.equal(g.ok, false)
    if (!g.ok) {
      assert.equal(g.status, 403)
      assert.match(g.error, /平台管理员/)
    }
  })
  it('ok when platform admin', () => {
    assert.deepEqual(checkPlatformAdminApiAccess(session({ user: { id: 'u1' }, isPlatformAdmin: true })), {
      ok: true,
    })
  })
})
