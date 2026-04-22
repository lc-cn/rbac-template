-- 自建 OAuth2：刷新令牌表（授权码换 token 时可签发 refresh_token；grant_type=refresh_token）
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
