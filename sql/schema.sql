-- LibSQL / Turso：空库一键建表（聚合 DDL）。表结构演进请先写 sql/migrations/NNN_*.sql，再把本文件维护到与迁移终点一致。应用：pnpm run db:apply-sql sql/schema.sql

CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "avatar" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

CREATE TABLE "Role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "UserRole" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("userId", "roleId"),
    CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- IdP OAuth2/OIDC 客户端：一条应用最多一条（applicationId UNIQUE），展示名用 Application.name
CREATE TABLE "OAuth2Client" (
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

CREATE TABLE "Feature" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "applicationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Feature_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Permission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "featureId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Permission_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("roleId", "permissionId"),
    CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "group" TEXT NOT NULL DEFAULT 'general',
    "label" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "OAuthProvider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");
CREATE UNIQUE INDEX "Application_name_key" ON "Application"("name");
CREATE UNIQUE INDEX "Application_code_key" ON "Application"("code");
CREATE UNIQUE INDEX "OAuth2Client_applicationId_key" ON "OAuth2Client"("applicationId");
CREATE UNIQUE INDEX "OAuth2Client_clientId_key" ON "OAuth2Client"("clientId");
CREATE UNIQUE INDEX "Feature_applicationId_code_key" ON "Feature"("applicationId", "code");
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");
CREATE UNIQUE INDEX "SystemConfig_key_key" ON "SystemConfig"("key");
CREATE UNIQUE INDEX "OAuthProvider_name_key" ON "OAuthProvider"("name");

CREATE TABLE "OAuth2AuthorizationCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "redirectUri" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "expiresAt" TEXT NOT NULL,
    "codeChallenge" TEXT,
    "codeChallengeMethod" TEXT,
    "nonce" TEXT,
    "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
    CONSTRAINT "OAuth2AuthorizationCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "OAuth2AuthorizationCode_code_key" ON "OAuth2AuthorizationCode"("code");
CREATE INDEX "OAuth2AuthorizationCode_expiresAt_idx" ON "OAuth2AuthorizationCode"("expiresAt");

-- 刷新令牌（offline_access / refresh_token 授权）
CREATE TABLE "OAuth2RefreshToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "expiresAt" TEXT NOT NULL,
    "revokedAt" TEXT,
    "replacedById" TEXT,
    "createdAt" TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX "OAuth2RefreshToken_tokenHash_key" ON "OAuth2RefreshToken"("tokenHash");
CREATE INDEX "OAuth2RefreshToken_clientId_idx" ON "OAuth2RefreshToken"("clientId");
CREATE INDEX "OAuth2RefreshToken_expiresAt_idx" ON "OAuth2RefreshToken"("expiresAt");
