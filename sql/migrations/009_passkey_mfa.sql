-- Issue #8：Passkey、用户自选 MFA、备份码、限流桶、挑战存储、核选项恢复、凭据版本（吊销 JWT）

ALTER TABLE "User" ADD COLUMN "credentialVersion" INTEGER NOT NULL DEFAULT 0;

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
