import type { ReactNode } from 'react'
import { RequireTenantRead } from '@/components/access/require-tenant-read'
import { PermissionCodes } from '@/lib/permission-codes'

export default function SystemConfigLayout({ children }: { children: ReactNode }) {
  return (
    <RequireTenantRead permission={PermissionCodes.SYSTEM_CONFIG_READ}>{children}</RequireTenantRead>
  )
}
