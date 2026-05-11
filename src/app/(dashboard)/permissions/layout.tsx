import type { ReactNode } from 'react'
import { RequireTenantRead } from '@/components/access/require-tenant-read'
import { PermissionCodes } from '@/lib/permission-codes'

export default function PermissionsLayout({ children }: { children: ReactNode }) {
  return <RequireTenantRead permission={PermissionCodes.PERM_READ}>{children}</RequireTenantRead>
}
