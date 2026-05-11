-- 多租户：Tenant / UserTenant、Application & Role 租户作用域、Permission 码在特性内唯一。
-- 存量库执行一次；若某步报「duplicate column」说明已执行过，可注释该步后重跑。
-- 默认租户 id 固定为 tenant_default，与种子/迁移回填一致。

CREATE TABLE IF NOT EXISTS "Tenant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_slug_key" ON "Tenant"("slug");

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

ALTER TABLE "User" ADD COLUMN "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT 0;

DROP INDEX IF EXISTS "Application_name_key";

DROP INDEX IF EXISTS "Application_code_key";

ALTER TABLE "Application" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT 'tenant_default';

CREATE UNIQUE INDEX IF NOT EXISTS "Application_tenantId_name_key" ON "Application"("tenantId", "name");

CREATE UNIQUE INDEX IF NOT EXISTS "Application_tenantId_code_key" ON "Application"("tenantId", "code");

DROP INDEX IF EXISTS "Role_name_key";

ALTER TABLE "Role" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT 'tenant_default';

CREATE UNIQUE INDEX IF NOT EXISTS "Role_tenantId_name_key" ON "Role"("tenantId", "name");

DROP INDEX IF EXISTS "Permission_code_key";

CREATE UNIQUE INDEX IF NOT EXISTS "Permission_featureId_code_key" ON "Permission"("featureId", "code");

INSERT OR IGNORE INTO "UserTenant" ("userId", "tenantId", "tenantRole", "createdAt")
SELECT DISTINCT ur."userId", 'tenant_default', 'member', datetime('now')
FROM "UserRole" ur;

INSERT OR IGNORE INTO "UserTenant" ("userId", "tenantId", "tenantRole", "createdAt")
SELECT u."id", 'tenant_default', 'member', datetime('now')
FROM "User" u
WHERE u."email" = (SELECT "value" FROM "SystemConfig" WHERE "key" = 'admin_email' LIMIT 1);

UPDATE "UserTenant"
SET "tenantRole" = 'member'
WHERE "tenantId" = 'tenant_default';

UPDATE "UserTenant"
SET "tenantRole" = 'owner'
WHERE "tenantId" = 'tenant_default'
  AND "userId" = (SELECT "id" FROM "User" WHERE "email" = (SELECT "value" FROM "SystemConfig" WHERE "key" = 'admin_email' LIMIT 1) LIMIT 1);

UPDATE "UserTenant"
SET "tenantRole" = 'owner'
WHERE "tenantId" = 'tenant_default'
  AND "userId" = (
    SELECT "userId" FROM "UserTenant" WHERE "tenantId" = 'tenant_default' ORDER BY "createdAt" ASC LIMIT 1
  )
  AND NOT EXISTS (
    SELECT 1 FROM "UserTenant" ut2 WHERE ut2."tenantId" = 'tenant_default' AND ut2."tenantRole" = 'owner'
  );

UPDATE "User"
SET "isPlatformAdmin" = 1
WHERE "email" = (SELECT "value" FROM "SystemConfig" WHERE "key" = 'admin_email' LIMIT 1);
