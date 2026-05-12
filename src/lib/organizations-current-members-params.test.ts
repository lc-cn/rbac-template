import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  ORGANIZATIONS_CURRENT_MEMBERS_PAGE_SIZE,
  ORGANIZATIONS_CURRENT_MEMBERS_SEARCH_DEBOUNCE_MS,
  parseOrganizationsCurrentMembersPageQuery,
} from './organizations-current-members-params.ts'

describe('organizations-current members params (Issue #16)', () => {
  it('fixes page size constant at 20', () => {
    assert.equal(ORGANIZATIONS_CURRENT_MEMBERS_PAGE_SIZE, 20)
  })

  it('documents debounce interval for search requests', () => {
    assert.equal(ORGANIZATIONS_CURRENT_MEMBERS_SEARCH_DEBOUNCE_MS, 300)
  })

  it('defaults page to 1 and q to empty', () => {
    const sp = new URLSearchParams()
    assert.deepEqual(parseOrganizationsCurrentMembersPageQuery(sp), { page: 1, q: '' })
  })

  it('parses valid page and trims q', () => {
    const sp = new URLSearchParams('page=3&q=%20alice%20')
    assert.deepEqual(parseOrganizationsCurrentMembersPageQuery(sp), { page: 3, q: 'alice' })
  })

  it('rejects non-positive or non-integer page', () => {
    assert.deepEqual(parseOrganizationsCurrentMembersPageQuery(new URLSearchParams('page=0')), {
      page: 1,
      q: '',
    })
    assert.deepEqual(parseOrganizationsCurrentMembersPageQuery(new URLSearchParams('page=-1')), {
      page: 1,
      q: '',
    })
    assert.deepEqual(parseOrganizationsCurrentMembersPageQuery(new URLSearchParams('page=2.7')), {
      page: 1,
      q: '',
    })
  })
})
