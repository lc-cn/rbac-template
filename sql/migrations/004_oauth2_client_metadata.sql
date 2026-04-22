-- OAuth2 客户端：展示信息、登出回调、令牌 TTL、授权类型、RP JWKS 等（管理后台可维护）
ALTER TABLE "OAuth2Client" ADD COLUMN "logoUrl" TEXT;
ALTER TABLE "OAuth2Client" ADD COLUMN "clientUri" TEXT;
ALTER TABLE "OAuth2Client" ADD COLUMN "policyUri" TEXT;
ALTER TABLE "OAuth2Client" ADD COLUMN "tosUri" TEXT;
ALTER TABLE "OAuth2Client" ADD COLUMN "postLogoutRedirectUrisJson" TEXT DEFAULT '[]';
ALTER TABLE "OAuth2Client" ADD COLUMN "jwksUri" TEXT;
ALTER TABLE "OAuth2Client" ADD COLUMN "allowedGrantTypes" TEXT DEFAULT 'authorization_code,refresh_token';
ALTER TABLE "OAuth2Client" ADD COLUMN "accessTokenTtlSeconds" INTEGER DEFAULT 3600;
ALTER TABLE "OAuth2Client" ADD COLUMN "refreshTokenTtlDays" INTEGER DEFAULT 30;
ALTER TABLE "OAuth2Client" ADD COLUMN "authorizationCodeTtlMinutes" INTEGER DEFAULT 10;

UPDATE "OAuth2Client" SET "postLogoutRedirectUrisJson" = '[]' WHERE "postLogoutRedirectUrisJson" IS NULL;
UPDATE "OAuth2Client" SET "allowedGrantTypes" = 'authorization_code,refresh_token' WHERE "allowedGrantTypes" IS NULL OR trim("allowedGrantTypes") = '';
UPDATE "OAuth2Client" SET "accessTokenTtlSeconds" = 3600 WHERE "accessTokenTtlSeconds" IS NULL;
UPDATE "OAuth2Client" SET "refreshTokenTtlDays" = 30 WHERE "refreshTokenTtlDays" IS NULL;
UPDATE "OAuth2Client" SET "authorizationCodeTtlMinutes" = 10 WHERE "authorizationCodeTtlMinutes" IS NULL;
