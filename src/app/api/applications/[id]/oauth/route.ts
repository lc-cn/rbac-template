import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  deleteOAuth2ClientAdmin,
  enableOAuthForApplication,
  getOAuth2ClientAdminById,
  updateOAuth2ClientAdmin,
} from '@/lib/oauth2/client-admin'
import { getApplicationById } from '@/lib/data-access'
import { PermissionCodes } from '@/lib/permission-codes'
import { guardTenantRbac } from '@/lib/rbac-server'
import { requireTenantId } from '@/lib/tenant-server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const tenantRes = requireTenantId(session)
    if (tenantRes instanceof NextResponse) return tenantRes
    const rbac = await guardTenantRbac(session, tenantRes, PermissionCodes.OAUTH_CLIENT_READ, request)
    if (rbac) return rbac
    const { id } = await params
    const app = await getApplicationById(id, tenantRes)
    if (!app) return NextResponse.json({ error: '应用不存在' }, { status: 404 })
    const dto = await getOAuth2ClientAdminById(id)
    if (!dto) {
      return NextResponse.json({
        configured: false,
        applicationId: id,
        applicationName: app.name,
        applicationCode: app.code,
      })
    }
    return NextResponse.json({ configured: true, ...dto })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '读取失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const tenantRes = requireTenantId(session)
    if (tenantRes instanceof NextResponse) return tenantRes
    const rbac = await guardTenantRbac(session, tenantRes, PermissionCodes.OAUTH_CLIENT_WRITE, request)
    if (rbac) return rbac
    const { id } = await params
    const app = await getApplicationById(id, tenantRes)
    if (!app) return NextResponse.json({ error: '应用不存在' }, { status: 404 })
    const body = await request.json()
    const {
      name,
      clientId,
      redirectUris,
      postLogoutRedirectUris,
      allowedScopes,
      confidential,
      clientSecret,
      logoUrl,
      clientUri,
      policyUri,
      tosUri,
      jwksUri,
      grantRefreshToken,
      accessTokenTtlSeconds,
      refreshTokenTtlDays,
      authorizationCodeTtlMinutes,
    } = body
    const { dto, plainSecret } = await enableOAuthForApplication(id, {
      name,
      clientId,
      redirectUris,
      postLogoutRedirectUris,
      allowedScopes,
      confidential: Boolean(confidential),
      plainSecret: clientSecret ?? null,
      logoUrl: logoUrl ?? null,
      clientUri: clientUri ?? null,
      policyUri: policyUri ?? null,
      tosUri: tosUri ?? null,
      jwksUri: jwksUri ?? null,
      grantRefreshToken: Boolean(grantRefreshToken),
      accessTokenTtlSeconds,
      refreshTokenTtlDays,
      authorizationCodeTtlMinutes,
    })
    return NextResponse.json(
      { ...dto, ...(plainSecret ? { clientSecret: plainSecret } : {}) },
      { status: 201 }
    )
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '创建失败'
    if (
      msg.includes('必填') ||
      msg.includes('至少') ||
      msg.includes('client_id') ||
      msg.includes('已配置')
    ) {
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: '保存失败' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const tenantRes = requireTenantId(session)
    if (tenantRes instanceof NextResponse) return tenantRes
    const rbac = await guardTenantRbac(session, tenantRes, PermissionCodes.OAUTH_CLIENT_WRITE, request)
    if (rbac) return rbac
    const { id } = await params
    const app = await getApplicationById(id, tenantRes)
    if (!app) return NextResponse.json({ error: '应用不存在' }, { status: 404 })
    const body = await request.json()
    const {
      name,
      redirectUris,
      postLogoutRedirectUris,
      allowedScopes,
      confidential,
      clientSecret,
      regenerateSecret,
      logoUrl,
      clientUri,
      policyUri,
      tosUri,
      jwksUri,
      grantRefreshToken,
      accessTokenTtlSeconds,
      refreshTokenTtlDays,
      authorizationCodeTtlMinutes,
    } = body
    const { dto, plainSecret } = await updateOAuth2ClientAdmin(id, {
      name,
      redirectUris,
      postLogoutRedirectUris,
      allowedScopes,
      confidential: confidential !== undefined ? Boolean(confidential) : undefined,
      plainSecret: clientSecret ?? null,
      regenerateSecret: Boolean(regenerateSecret),
      logoUrl: logoUrl ?? null,
      clientUri: clientUri ?? null,
      policyUri: policyUri ?? null,
      tosUri: tosUri ?? null,
      jwksUri: jwksUri ?? null,
      grantRefreshToken: grantRefreshToken !== undefined ? Boolean(grantRefreshToken) : undefined,
      accessTokenTtlSeconds,
      refreshTokenTtlDays,
      authorizationCodeTtlMinutes,
    })
    return NextResponse.json({ ...dto, ...(plainSecret ? { clientSecret: plainSecret } : {}) })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '更新失败'
    if (msg.includes('必填') || msg.includes('至少') || msg.includes('不存在')) {
      return NextResponse.json({ error: msg }, { status: msg.includes('不存在') ? 404 : 400 })
    }
    console.error(error)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const tenantRes = requireTenantId(session)
    if (tenantRes instanceof NextResponse) return tenantRes
    const rbac = await guardTenantRbac(session, tenantRes, PermissionCodes.OAUTH_CLIENT_WRITE, request)
    if (rbac) return rbac
    const { id } = await params
    const app = await getApplicationById(id, tenantRes)
    if (!app) return NextResponse.json({ error: '应用不存在' }, { status: 404 })
    const ok = await deleteOAuth2ClientAdmin(id)
    if (!ok) return NextResponse.json({ error: '应用不存在' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}
