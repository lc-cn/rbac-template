-- LibSQL / Turso：聚合 DDL（建表/索引均 IF NOT EXISTS，可对已建库重复执行以补齐缺表缺索引）。表结构演进请先写 sql/migrations/NNN_*.sql 再同步本文件。应用：pnpm run db:apply-sql sql/schema.sql

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "avatar" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT false,
    "credentialVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Tenant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "archivedAt" DATETIME,
    "suspendedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_slug_key" ON "Tenant"("slug");

CREATE TABLE IF NOT EXISTS "Invitation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "inviterUserId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "consumedAt" DATETIME,
    "targetRole" TEXT NOT NULL DEFAULT 'member',
    "emailConstraint" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invitation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Invitation_inviterUserId_fkey" FOREIGN KEY ("inviterUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Invitation_tokenHash_key" ON "Invitation"("tokenHash");
CREATE INDEX IF NOT EXISTS "Invitation_tenantId_idx" ON "Invitation"("tenantId");

CREATE TABLE IF NOT EXISTS "OwnerTransferRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "OwnerTransferRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OwnerTransferRequest_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OwnerTransferRequest_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "OwnerTransferRequest_tenantId_idx" ON "OwnerTransferRequest"("tenantId");
CREATE INDEX IF NOT EXISTS "OwnerTransferRequest_status_idx" ON "OwnerTransferRequest"("status");

CREATE TABLE IF NOT EXISTS "UserTenant" (
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tenantRole" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("userId", "tenantId"),
    CONSTRAINT "UserTenant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserTenant_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserTenant_one_owner_per_tenant" ON "UserTenant"("tenantId") WHERE "tenantRole" = 'owner';

CREATE INDEX IF NOT EXISTS "UserTenant_tenantId_idx" ON "UserTenant"("tenantId");

INSERT OR IGNORE INTO "Tenant" ("id", "name", "slug", "createdAt", "updatedAt")
VALUES ('tenant_default', '默认组织', 'default', datetime('now'), datetime('now'));

CREATE TABLE IF NOT EXISTS "Account" (
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

CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "Role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tenantId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Role_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "UserRole" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("userId", "roleId"),
    CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Application_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- IdP OAuth2/OIDC 客户端：一条应用最多一条（applicationId UNIQUE），展示名用 Application.name
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

CREATE TABLE IF NOT EXISTS "Feature" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "applicationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Feature_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Permission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "featureId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Permission_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("roleId", "permissionId"),
    CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "SystemConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "group" TEXT NOT NULL DEFAULT 'general',
    "label" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
CREATE UNIQUE INDEX IF NOT EXISTS "Role_tenantId_name_key" ON "Role"("tenantId", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "Application_tenantId_name_key" ON "Application"("tenantId", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "Application_tenantId_code_key" ON "Application"("tenantId", "code");
CREATE UNIQUE INDEX IF NOT EXISTS "OAuth2Client_applicationId_key" ON "OAuth2Client"("applicationId");
CREATE UNIQUE INDEX IF NOT EXISTS "OAuth2Client_clientId_key" ON "OAuth2Client"("clientId");
CREATE UNIQUE INDEX IF NOT EXISTS "Feature_applicationId_code_key" ON "Feature"("applicationId", "code");
CREATE UNIQUE INDEX IF NOT EXISTS "Permission_featureId_code_key" ON "Permission"("featureId", "code");
CREATE UNIQUE INDEX IF NOT EXISTS "SystemConfig_key_key" ON "SystemConfig"("key");

CREATE TABLE IF NOT EXISTS "OAuth2AuthorizationCode" (
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

CREATE UNIQUE INDEX IF NOT EXISTS "OAuth2AuthorizationCode_code_key" ON "OAuth2AuthorizationCode"("code");
CREATE INDEX IF NOT EXISTS "OAuth2AuthorizationCode_expiresAt_idx" ON "OAuth2AuthorizationCode"("expiresAt");

-- 刷新令牌（offline_access / refresh_token 授权）
CREATE TABLE IF NOT EXISTS "OAuth2RefreshToken" (
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

CREATE UNIQUE INDEX IF NOT EXISTS "OAuth2RefreshToken_tokenHash_key" ON "OAuth2RefreshToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "OAuth2RefreshToken_clientId_idx" ON "OAuth2RefreshToken"("clientId");
CREATE INDEX IF NOT EXISTS "OAuth2RefreshToken_expiresAt_idx" ON "OAuth2RefreshToken"("expiresAt");

CREATE TABLE IF NOT EXISTS "UserMfaSecurity" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "mfaEnabled" INTEGER NOT NULL DEFAULT 0,
    "totpSecretEnc" TEXT,
    "backupCodesSalt" TEXT,
    "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
    "updatedAt" TEXT NOT NULL DEFAULT (datetime('now')),
    CONSTRAINT "UserMfaSecurity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "UserBackupCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "usedAt" TEXT,
    "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
    CONSTRAINT "UserBackupCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "UserBackupCode_userId_idx" ON "UserBackupCode"("userId");

CREATE TABLE IF NOT EXISTS "WebAuthnCredential" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "counter" INTEGER NOT NULL DEFAULT 0,
    "transports" TEXT,
    "canLogin" INTEGER NOT NULL DEFAULT 0,
    "canMfa" INTEGER NOT NULL DEFAULT 0,
    "label" TEXT,
    "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
    CONSTRAINT "WebAuthnCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "WebAuthnCredential_credentialId_key" ON "WebAuthnCredential"("credentialId");
CREATE INDEX IF NOT EXISTS "WebAuthnCredential_userId_idx" ON "WebAuthnCredential"("userId");

CREATE TABLE IF NOT EXISTS "WebAuthnChallenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "challenge" TEXT NOT NULL,
    "userId" TEXT,
    "kind" TEXT NOT NULL,
    "email" TEXT,
    "expiresAt" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS "WebAuthnChallenge_expiresAt_idx" ON "WebAuthnChallenge"("expiresAt");

CREATE TABLE IF NOT EXISTS "RateLimitBucket" (
    "bucketKey" TEXT NOT NULL,
    "windowStart" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY ("bucketKey", "windowStart")
);

CREATE TABLE IF NOT EXISTS "MfaRecoveryToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TEXT NOT NULL,
    "usedAt" TEXT,
    "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
    CONSTRAINT "MfaRecoveryToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "MfaRecoveryToken_tokenHash_key" ON "MfaRecoveryToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "MfaRecoveryToken_userId_idx" ON "MfaRecoveryToken"("userId");

CREATE TABLE IF NOT EXISTS "SecurityAuditEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "kind" TEXT NOT NULL,
    "meta" TEXT,
    "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
    CONSTRAINT "SecurityAuditEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "SecurityAuditEvent_userId_idx" ON "SecurityAuditEvent"("userId");
CREATE INDEX IF NOT EXISTS "SecurityAuditEvent_kind_idx" ON "SecurityAuditEvent"("kind");
