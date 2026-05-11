-- 下线控制台 OAuth 登录：删除 OAuthProvider 表及 RBAC 种子中的 oauth_provider:* 权限与对应功能模块

DELETE FROM "RolePermission" WHERE "permissionId" IN (
  SELECT "id" FROM "Permission" WHERE "code" LIKE 'oauth_provider:%'
);

DELETE FROM "Permission" WHERE "code" LIKE 'oauth_provider:%';

DELETE FROM "Feature" WHERE "code" = 'oauth-provider-mgmt';

DROP TABLE IF EXISTS "OAuthProvider";

DELETE FROM "Account" WHERE "provider" IN ('github', 'google', 'oidc');
