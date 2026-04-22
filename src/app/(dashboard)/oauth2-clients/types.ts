import type { OAuth2ClientAdminDto } from '@/lib/oauth2/client-admin'

/** 与 API / 管理端 DTO 一致 */
export type OAuth2ClientDto = OAuth2ClientAdminDto

export type OAuth2ClientFormState = {
  name: string
  clientId: string
  redirectLines: string
  postLogoutLines: string
  scopeProfile: boolean
  scopeEmail: boolean
  scopeOffline: boolean
  grantRefreshToken: boolean
  accessTokenTtlSeconds: number
  refreshTokenTtlDays: number
  authorizationCodeTtlMinutes: number
  logoUrl: string
  clientUri: string
  policyUri: string
  tosUri: string
  jwksUri: string
  confidential: boolean
  clientSecret: string
  regenerateSecret: boolean
}

export function defaultFormState(): OAuth2ClientFormState {
  return {
    name: '',
    clientId: '',
    redirectLines: 'http://localhost:5173/oauth/callback',
    postLogoutLines: '',
    scopeProfile: true,
    scopeEmail: true,
    scopeOffline: true,
    grantRefreshToken: true,
    accessTokenTtlSeconds: 3600,
    refreshTokenTtlDays: 30,
    authorizationCodeTtlMinutes: 10,
    logoUrl: '',
    clientUri: '',
    policyUri: '',
    tosUri: '',
    jwksUri: '',
    confidential: true,
    clientSecret: '',
    regenerateSecret: false,
  }
}

export function scopesFromForm(f: OAuth2ClientFormState): string {
  const parts = ['openid']
  if (f.scopeProfile) parts.push('profile')
  if (f.scopeEmail) parts.push('email')
  if (f.scopeOffline) parts.push('offline_access')
  return parts.join(' ')
}

export function formStateFromDto(row: OAuth2ClientDto): OAuth2ClientFormState {
  const s = new Set((row.allowedScopes || '').split(/\s+/).filter(Boolean))
  const redirects = Array.isArray(row.redirectUris) ? row.redirectUris : []
  const postLogout = Array.isArray(row.postLogoutRedirectUris) ? row.postLogoutRedirectUris : []
  return {
    name: row.name,
    clientId: row.clientId,
    redirectLines: redirects.join('\n'),
    postLogoutLines: postLogout.join('\n'),
    scopeProfile: s.has('profile'),
    scopeEmail: s.has('email'),
    scopeOffline: s.has('offline_access'),
    grantRefreshToken: row.grantRefreshToken !== false,
    accessTokenTtlSeconds: Number(row.accessTokenTtlSeconds) || 3600,
    refreshTokenTtlDays: Number(row.refreshTokenTtlDays) || 30,
    authorizationCodeTtlMinutes: Number(row.authorizationCodeTtlMinutes) || 10,
    logoUrl: row.logoUrl ?? '',
    clientUri: row.clientUri ?? '',
    policyUri: row.policyUri ?? '',
    tosUri: row.tosUri ?? '',
    jwksUri: row.jwksUri ?? '',
    confidential: !row.isPublic,
    clientSecret: '',
    regenerateSecret: false,
  }
}
