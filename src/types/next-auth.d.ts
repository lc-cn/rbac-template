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
  }
}
