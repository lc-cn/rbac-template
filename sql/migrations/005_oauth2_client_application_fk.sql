-- OAuth2Client.applicationId → Application；从 Application.oauth* 迁出后删列（仅遗留库含 oauth 列时执行一次）
CREATE TABLE IF NOT EXISTS "OAuth2Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientSecretHash" TEXT,
    "redirectUrisJson" TEXT NOT NULL,
    "allowedScopes" TEXT NOT NULL DEFAULT 'openid profile email offline_access',
    "logoUrl" TEXT,
    "clientUri" TEXT,
    "policyUri" TEXT,
    "tosUri" TEXT,
    "postLogoutRedirectUrisJson" TEXT NOT NULL DEFAULT '[]',
    "jwksUri" TEXT,
    "allowedGrantTypes" TEXT NOT NULL DEFAULT 'authorization_code,refresh_token',
    "accessTokenTtlSeconds" INTEGER NOT NULL DEFAULT 3600,
    "refreshTokenTtlDays" INTEGER NOT NULL DEFAULT 30,
    "authorizationCodeTtlMinutes" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
    "updatedAt" TEXT NOT NULL DEFAULT (datetime('now')),
    CONSTRAINT "OAuth2Client_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "OAuth2Client_applicationId_key" ON "OAuth2Client"("applicationId");
CREATE UNIQUE INDEX IF NOT EXISTS "OAuth2Client_clientId_key" ON "OAuth2Client"("clientId");

INSERT INTO "OAuth2Client" ("id","applicationId","clientId","clientSecretHash","redirectUrisJson","allowedScopes","logoUrl","clientUri","policyUri","tosUri","postLogoutRedirectUrisJson","jwksUri","allowedGrantTypes","accessTokenTtlSeconds","refreshTokenTtlDays","authorizationCodeTtlMinutes","createdAt","updatedAt")
SELECT lower(hex(randomblob(16))), a."id", a."oauthClientId", a."oauthClientSecretHash", COALESCE(a."oauthRedirectUrisJson",'[]'), COALESCE(a."oauthAllowedScopes",'openid profile email offline_access'), a."oauthLogoUrl", a."oauthClientUri", a."oauthPolicyUri", a."oauthTosUri", COALESCE(a."oauthPostLogoutRedirectUrisJson",'[]'), a."oauthJwksUri", COALESCE(a."oauthAllowedGrantTypes",'authorization_code,refresh_token'), COALESCE(a."oauthAccessTokenTtlSeconds",3600), COALESCE(a."oauthRefreshTokenTtlDays",30), COALESCE(a."oauthAuthorizationCodeTtlMinutes",10), COALESCE(a."createdAt",datetime('now')), COALESCE(a."updatedAt",datetime('now'))
FROM "Application" a
WHERE a."oauthClientId" IS NOT NULL AND trim(a."oauthClientId") != '' AND NOT EXISTS (SELECT 1 FROM "OAuth2Client" o WHERE o."applicationId" = a."id");

DROP INDEX IF EXISTS "Application_oauthClientId_key";

ALTER TABLE "Application" DROP COLUMN "oauthClientId";
ALTER TABLE "Application" DROP COLUMN "oauthClientSecretHash";
ALTER TABLE "Application" DROP COLUMN "oauthRedirectUrisJson";
ALTER TABLE "Application" DROP COLUMN "oauthAllowedScopes";
ALTER TABLE "Application" DROP COLUMN "oauthLogoUrl";
ALTER TABLE "Application" DROP COLUMN "oauthClientUri";
ALTER TABLE "Application" DROP COLUMN "oauthPolicyUri";
ALTER TABLE "Application" DROP COLUMN "oauthTosUri";
ALTER TABLE "Application" DROP COLUMN "oauthPostLogoutRedirectUrisJson";
ALTER TABLE "Application" DROP COLUMN "oauthJwksUri";
ALTER TABLE "Application" DROP COLUMN "oauthAllowedGrantTypes";
ALTER TABLE "Application" DROP COLUMN "oauthAccessTokenTtlSeconds";
ALTER TABLE "Application" DROP COLUMN "oauthRefreshTokenTtlDays";
ALTER TABLE "Application" DROP COLUMN "oauthAuthorizationCodeTtlMinutes";
