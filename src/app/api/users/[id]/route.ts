import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  getUserById,
  getUserTenantRole,
  isUniqueConstraintError,
  removeUserFromTenant,
  setUserTenantGovernanceRole,
  updateUser,
} from '@/lib/data-access'
import {
  canChangeTenantGovernanceRole,
  canRemoveMember,
  canUpdateOtherUserInTenant,
} from '@/lib/governance-policy'
import { governanceForbiddenResponse, requireActorTenantRole } from '@/lib/governance-server'
import { PermissionCodes } from '@/lib/permission-codes'
import { guardTenantRbac } from '@/lib/rbac-server'
import { requireTenantId } from '@/lib/tenant-server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const tenantRes = requireTenantId(session)
    if (tenantRes instanceof NextResponse) return tenantRes
    const rbac = await guardTenantRbac(session, tenantRes, PermissionCodes.USER_READ, request)
    if (rbac) return rbac
    const { id } = await params
    const user = await getUserById(id, tenantRes)
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }
    return NextResponse.json(user)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: '获取用户失败' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const tenantRes = requireTenantId(session)
    if (tenantRes instanceof NextResponse) return tenantRes
    const actor = await requireActorTenantRole(session, tenantRes)
    if (actor instanceof NextResponse) return actor
    const gov = canUpdateOtherUserInTenant(actor.tenantRole)
    if (!gov.ok) return governanceForbiddenResponse(gov.code)
    const rbac = await guardTenantRbac(session, tenantRes, PermissionCodes.USER_UPDATE, request)
    if (rbac) return rbac

    const { id } = await params
    const body = await request.json()
    const { name, email, password, avatar, status, roleIds, tenantRole: tenantRoleBody } = body

    const targetMembershipRole = await getUserTenantRole(id, tenantRes)
    if (!targetMembershipRole) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    if (tenantRoleBody !== undefined && tenantRoleBody !== null) {
      const raw = typeof tenantRoleBody === 'string' ? tenantRoleBody.trim().toLowerCase() : ''
      const next =
        raw === 'admin' || raw === 'member' ? (raw as 'admin' | 'member') : null
      if (!next) {
        return governanceForbiddenResponse('forbidden_invalid_tenant_role')
      }
      const tr = canChangeTenantGovernanceRole(actor.tenantRole, targetMembershipRole, next)
      if (!tr.ok) return governanceForbiddenResponse(tr.code)
      const sr = await setUserTenantGovernanceRole(tenantRes, id, next)
      if (sr === 'not_found') return NextResponse.json({ error: '用户不存在' }, { status: 404 })
      if (sr === 'target_is_owner') return governanceForbiddenResponse('forbidden_owner_only')
    }

    const user = await updateUser(id, tenantRes, {
      name,
      email,
      ...(password ? { password } : {}),
      avatar,
      status,
      roleIds,
    })
    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    return NextResponse.json(user)
  } catch (error: unknown) {
    console.error(error)
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: '邮箱已存在' }, { status: 400 })
    }
    return NextResponse.json({ error: '更新用户失败' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const tenantRes = requireTenantId(session)
    if (tenantRes instanceof NextResponse) return tenantRes
    const actor = await requireActorTenantRole(session, tenantRes)
    if (actor instanceof NextResponse) return actor
    const { id } = await params
    const targetRole = await getUserTenantRole(id, tenantRes)
    if (!targetRole) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }
    const rm = canRemoveMember(actor.tenantRole, targetRole)
    if (!rm.ok) return governanceForbiddenResponse(rm.code)
    const rbac = await guardTenantRbac(session, tenantRes, PermissionCodes.USER_DELETE, request)
    if (rbac) return rbac

    await removeUserFromTenant(tenantRes, id)
    return NextResponse.json({ message: '已从当前租户移除' })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: '移除用户失败' }, { status: 500 })
  }
}
