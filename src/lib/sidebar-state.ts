/** 桌面端侧栏收起状态（仅 md+ 读写；移动端抽屉不使用此值）。 */
export const SIDEBAR_COLLAPSED_STORAGE_KEY = 'rbac-dashboard-sidebar-collapsed'

export function readSidebarCollapsedFromStorage(raw: string | null): boolean {
  if (raw == null || raw === '') return false
  return raw === '1' || raw === 'true'
}

export function writeSidebarCollapsedToStorage(collapsed: boolean): string {
  return collapsed ? 'true' : 'false'
}
