import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  readSidebarCollapsedFromStorage,
  writeSidebarCollapsedToStorage,
} from './sidebar-state.ts'

describe('sidebar-state', () => {
  it('defaults to expanded when missing or empty', () => {
    assert.equal(readSidebarCollapsedFromStorage(null), false)
    assert.equal(readSidebarCollapsedFromStorage(''), false)
  })

  it('parses true and 1 as collapsed', () => {
    assert.equal(readSidebarCollapsedFromStorage('true'), true)
    assert.equal(readSidebarCollapsedFromStorage('1'), true)
  })

  it('treats other strings as expanded', () => {
    assert.equal(readSidebarCollapsedFromStorage('false'), false)
    assert.equal(readSidebarCollapsedFromStorage('0'), false)
    assert.equal(readSidebarCollapsedFromStorage('maybe'), false)
  })

  it('serializes collapsed flag', () => {
    assert.equal(writeSidebarCollapsedToStorage(true), 'true')
    assert.equal(writeSidebarCollapsedToStorage(false), 'false')
  })
})
