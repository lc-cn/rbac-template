import type { TenantRole } from '@/lib/data-access'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
    currentTenantId?: string | null
    isPlatformAdmin?: boolean
    tenantRole?: TenantRole | null
    /** 有 `currentTenantId` 时：该租户下生效的 permission code；无租户时为 `null`。 */
    tenantPermissionCodes?: string[] | null
    mfaPending?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    name?: string | null
    email?: string | null
    picture?: string | null
    currentTenantId?: string | null
    isPlatformAdmin?: boolean
    tenantRole?: TenantRole | null
    tenantPermissionCodes?: string[] | null
    mfaPending?: boolean
    mfaDeadline?: number
    credentialVersion?: number
  }
}
