import type { ReactNode } from 'react'
import { RequireTenantRead } from '@/components/access/require-tenant-read'
import { PermissionCodes } from '@/lib/permission-codes'

export default function ApplicationIdpLayout({ children }: { children: ReactNode }) {
  return (
    <RequireTenantRead permission={PermissionCodes.OAUTH_CLIENT_READ}>{children}</RequireTenantRead>
  )
}
