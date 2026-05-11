/**
 * 租户内 RBAC 权限码（与 `Permission.code`、种子数据一致）。
 * 路由映射见 `tenant-route-permissions.ts` 与 `docs/governance-matrix.md`。
 */
export const PermissionCodes = {
  USER_READ: 'user:read',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',

  ROLE_READ: 'role:read',
  ROLE_CREATE: 'role:create',
  ROLE_UPDATE: 'role:update',
  ROLE_DELETE: 'role:delete',

  PERM_READ: 'perm:read',
  PERM_CREATE: 'perm:create',
  PERM_UPDATE: 'perm:update',
  PERM_DELETE: 'perm:delete',

  APPLICATION_READ: 'application:read',
  APPLICATION_CREATE: 'application:create',
  APPLICATION_UPDATE: 'application:update',
  APPLICATION_DELETE: 'application:delete',

  /** 应用下的「功能模块」（Feature 实体） */
  FEATURE_READ: 'feature:read',
  FEATURE_CREATE: 'feature:create',
  FEATURE_UPDATE: 'feature:update',
  FEATURE_DELETE: 'feature:delete',

  /** OAuth2/OIDC 客户端（密钥敏感） */
  OAUTH_CLIENT_READ: 'oauth_client:read',
  OAUTH_CLIENT_WRITE: 'oauth_client:write',

  SYSTEM_CONFIG_READ: 'system_config:read',
  SYSTEM_CONFIG_UPDATE: 'system_config:update',

  OAUTH_PROVIDER_READ: 'oauth_provider:read',
  OAUTH_PROVIDER_CREATE: 'oauth_provider:create',
  OAUTH_PROVIDER_UPDATE: 'oauth_provider:update',
  OAUTH_PROVIDER_DELETE: 'oauth_provider:delete',
} as const

export type PermissionCode = (typeof PermissionCodes)[keyof typeof PermissionCodes]
