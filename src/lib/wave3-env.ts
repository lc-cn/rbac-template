/**
 * Issue #6 第三波及可选能力开关（FEATURE_*）。
 */

export function featureInvitesEnabled(): boolean {
  const v = process.env.FEATURE_INVITES?.trim().toLowerCase() ?? 'true'
  if (v === '0' || v === 'false' || v === 'no' || v === 'off') return false
  return true
}

export function featureOwnerTransferEnabled(): boolean {
  const v = process.env.FEATURE_OWNER_TRANSFER?.trim().toLowerCase() ?? 'true'
  if (v === '0' || v === 'false' || v === 'no' || v === 'off') return false
  return true
}
