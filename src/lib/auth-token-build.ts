import { getUserByIdGlobal, resolveJwtTenantClaims } from '@/lib/data-access'
import { getUserCredentialVersion } from '@/lib/security-data-access'

export async function buildSessionJwtClaims(userId: string): Promise<Record<string, unknown>> {
  const user = await getUserByIdGlobal(userId)
  if (!user || !user.status) throw new Error('user_invalid')
  const claims = await resolveJwtTenantClaims(userId)
  const credentialVersion = await getUserCredentialVersion(userId)
  const profileImage = user.image ?? user.avatar ?? undefined
  return {
    sub: userId,
    id: userId,
    name: user.name,
    email: user.email,
    picture: profileImage,
    currentTenantId: claims.currentTenantId,
    tenantRole: claims.tenantRole,
    isPlatformAdmin: claims.isPlatformAdmin,
    credentialVersion,
  }
}

export async function buildMfaPendingClaims(userId: string): Promise<Record<string, unknown>> {
  const base = await buildSessionJwtClaims(userId)
  const now = Math.floor(Date.now() / 1000)
  return {
    ...base,
    mfaPending: true,
    mfaDeadline: now + 600,
  }
}
