-- 若你已在早期版本应用过 sql/schema.sql，可单独执行本文件补齐 OAuth2 授权服务器表。
-- 新克隆仓库直接使用根目录 sql/schema.sql 即可（已包含下列 DDL）。

CREATE TABLE IF NOT EXISTS "OAuth2Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "clientSecretHash" TEXT,
    "name" TEXT NOT NULL,
    "redirectUrisJson" TEXT NOT NULL,
    "allowedScopes" TEXT NOT NULL DEFAULT 'openid profile email offline_access',
    "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
    "updatedAt" TEXT NOT NULL DEFAULT (datetime('now'))
);

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

CREATE UNIQUE INDEX IF NOT EXISTS "OAuth2Client_clientId_key" ON "OAuth2Client"("clientId");
CREATE UNIQUE INDEX IF NOT EXISTS "OAuth2AuthorizationCode_code_key" ON "OAuth2AuthorizationCode"("code");
CREATE INDEX IF NOT EXISTS "OAuth2AuthorizationCode_expiresAt_idx" ON "OAuth2AuthorizationCode"("expiresAt");
