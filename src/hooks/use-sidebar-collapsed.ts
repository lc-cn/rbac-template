'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  readSidebarCollapsedFromStorage,
  SIDEBAR_COLLAPSED_STORAGE_KEY,
  writeSidebarCollapsedToStorage,
} from '@/lib/sidebar-state'

const MD_UP = '(min-width: 768px)'

/**
 * 桌面端侧栏收起偏好：读写到 localStorage；移动端仅抽屉导航，忽略收起宽度。
 */
export function useSidebarCollapsed() {
  const [isDesktop, setIsDesktop] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [storageReady, setStorageReady] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia(MD_UP)
    const sync = () => {
      queueMicrotask(() => setIsDesktop(mq.matches))
    }
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    queueMicrotask(() => {
      try {
        const raw = localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY)
        setCollapsed(readSidebarCollapsedFromStorage(raw))
      } catch {
        setCollapsed(false)
      }
      setStorageReady(true)
    })
  }, [])

  const setCollapsedPersist = useCallback((next: boolean) => {
    setCollapsed(next)
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, writeSidebarCollapsedToStorage(next))
    } catch {
      /* ignore */
    }
  }, [])

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, writeSidebarCollapsedToStorage(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  const effectiveCollapsed = storageReady && isDesktop && collapsed

  return {
    /** 是否应在桌面壳层显示「收起」侧栏 */
    effectiveCollapsed,
    /** 当前持久化的收起偏好（与移动端无关） */
    collapsedPreference: collapsed,
    setCollapsed: setCollapsedPersist,
    toggleCollapsed,
    isDesktop,
    storageReady,
  }
}
