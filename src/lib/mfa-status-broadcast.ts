/** 个人中心安全卡加载后广播，供控制台 MFA 提示条等同步 `mfaEnabled`，避免重复请求。 */
export const MFA_STATUS_UPDATED_EVENT = 'rbac:mfa-status-updated'

export type MfaStatusUpdatedDetail = { mfaEnabled: boolean }

export function broadcastMfaStatusUpdated(detail: MfaStatusUpdatedDetail) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent<MfaStatusUpdatedDetail>(MFA_STATUS_UPDATED_EVENT, { detail }))
}
