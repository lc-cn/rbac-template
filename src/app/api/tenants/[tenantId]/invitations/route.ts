import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createInvitationRecord, listInvitationsForTenant } from '@/lib/data-access'
import { canAddMember } from '@/lib/governance-policy'
import { governanceForbiddenResponse, requireActorTenantRole } from '@/lib/governance-server'
import { PermissionCodes } from '@/lib/permission-codes'
import { guardTenantRbac } from '@/lib/rbac-server'
import { requireTenantId } from '@/lib/tenant-server'
import { featureInvitesEnabled } from '@/lib/wave3-env'

export async function GET(request: NextRequest, { params }: { params: Promise<{ tenantId: string }> }) {
  try {
    if (!featureInvitesEnabled()) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    const { tenantId } = await params
    const session = await auth()
    const tenantRes = requireTenantId(session)
    if (tenantRes instanceof Response) return tenantRes
    if (tenantRes !== tenantId) {
      return NextResponse.json({ error: '租户上下文不一致' }, { status: 403 })
    }
    const rbac = await guardTenantRbac(session, tenantRes, PermissionCodes.USER_READ, request)
    if (rbac) return rbac
    const rows = await listInvitationsForTenant(tenantId)
    return NextResponse.json({ invitations: rows })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'list_failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ tenantId: string }> }) {
  try {
    if (!featureInvitesEnabled()) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    const { tenantId } = await params
    const session = await auth()
    const tenantRes = requireTenantId(session)
    if (tenantRes instanceof Response) return tenantRes
    if (tenantRes !== tenantId) {
      return NextResponse.json({ error: '租户上下文不一致' }, { status: 403 })
    }
    const actor = await requireActorTenantRole(session, tenantRes)
    if (actor instanceof NextResponse) return actor
    const add = canAddMember(actor.tenantRole)
    if (!add.ok) return governanceForbiddenResponse(add.code)
    const rbac = await guardTenantRbac(session, tenantRes, PermissionCodes.USER_CREATE, request)
    if (rbac) return rbac

    const body = (await request.json()) as { expiresInDays?: unknown; email?: unknown }
    let days = 7
    if (typeof body.expiresInDays === 'number' && Number.isFinite(body.expiresInDays)) {
      days = Math.min(30, Math.max(1, Math.floor(body.expiresInDays)))
    }
    const expiresAtIso = new Date(Date.now() + days * 86400000).toISOString()
    const emailRaw = typeof body.email === 'string' ? body.email.trim() : ''
    const emailConstraint = emailRaw.length ? emailRaw.toLowerCase() : null

    const created = await createInvitationRecord({
      tenantId,
      inviterUserId: actor.userId,
      expiresAtIso,
      emailConstraint,
    })
    return NextResponse.json({
      invitationId: created.id,
      token: created.plainToken,
      expiresAt: expiresAtIso,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'create_failed' }, { status: 500 })
  }
}
