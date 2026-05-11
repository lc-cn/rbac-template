# 租户治理 × RBAC 矩阵（H2）

本文档与 `CONTEXT.md` 术语一致：**第一波（Issue #4）** 收紧租户治理（`UserTenant.tenantRole`）；**第二波（Issue #5）** 在具备当前租户上下文与成员资格的前提下，对租户内业务 API 增加 **Permission.code** 校验。二者关系：**先满足治理（若该路由声明了治理要求），再通过 RBAC（若声明了 permission）**；403 机器码分别为第一波 **`forbidden_*`** 与第二波 **`forbidden_permission`**。

## 策略摘要

| 维度 | 说明 |
|------|------|
| **治理** | `owner` / `admin` / `member`：成员增删、`tenantRole` 等（`/api/users` 写路径） |
| **RBAC** | `Permission.code`（`UserRole` → `Role` → `RolePermission` → `Permission`，且 `Role.tenantId` 与租户一致） |
| **平台管理员** | 无 `currentTenantId` 时仅只读平台 API；进入租户后 **无豁免**，须具备 `UserTenant` + 对应 permission |
| **旁路开关** | 环境变量 `ENFORCE_RBAC_ON_WRITE`：为 `0` / `false` / `no` / `off` 时 **跳过** 第二波 RBAC（仅运维排障；默认开启） |

**数据源**：治理角色以数据库 `UserTenant` 为准；RBAC 以数据库联结查询为准（见 `userHasPermission`）。

## 路由对照（治理 × Permission）

下列 **`Permission`** 列为第二波所需业务权限码（与 `src/lib/permission-codes.ts`、`scripts/seed.mjs` 一致）。**`Governance`** 列为第一波治理侧要求（仅 `/api/users` 写路径）。

| Route | Method | Governance | Permission | 备注 |
|-------|--------|------------|------------|------|
| `/api/users` | GET | — | `user:read` | |
| `/api/users` | POST | owner / admin | `user:create` | |
| `/api/users/[id]` | GET | — | `user:read` | |
| `/api/users/[id]` | PUT | owner / admin | `user:update` | 含 `tenantRole`（admin↔member）时亦须满足治理规则 |
| `/api/users/[id]` | DELETE | owner / admin；不可删 owner | `user:delete` | |
| `/api/roles` | GET | — | `role:read` | |
| `/api/roles` | POST | — | `role:create` | |
| `/api/roles/[id]` | GET | — | `role:read` | |
| `/api/roles/[id]` | PUT | — | `role:update` | |
| `/api/roles/[id]` | DELETE | — | `role:delete` | |
| `/api/permissions` | GET | — | `perm:read` | |
| `/api/permissions` | POST | — | `perm:create` | |
| `/api/permissions/[id]` | GET | — | `perm:read` | |
| `/api/permissions/[id]` | PUT | — | `perm:update` | |
| `/api/permissions/[id]` | DELETE | — | `perm:delete` | |
| `/api/applications` | GET | — | `application:read` | |
| `/api/applications` | POST | — | `application:create` | |
| `/api/applications/[id]` | GET | — | `application:read` | |
| `/api/applications/[id]` | PUT | — | `application:update` | |
| `/api/applications/[id]` | DELETE | — | `application:delete` | |
| `/api/features` | GET | — | `feature:read` | 指应用下 **Feature** 实体（功能模块） |
| `/api/features` | POST | — | `feature:create` | |
| `/api/features/[id]` | GET | — | `feature:read` | |
| `/api/features/[id]` | PUT | — | `feature:update` | |
| `/api/features/[id]` | DELETE | — | `feature:delete` | |
| `/api/applications/[id]/oauth` | GET | — | `oauth_client:read` | 响应含密钥相关字段，敏感 |
| `/api/applications/[id]/oauth` | POST | — | `oauth_client:write` | |
| `/api/applications/[id]/oauth` | PUT | — | `oauth_client:write` | |
| `/api/applications/[id]/oauth` | DELETE | — | `oauth_client:write` | |
| `/api/system-config` | GET | — | `system_config:read` | |
| `/api/system-config` | PUT | — | `system_config:update` | |
| `/api/oauth-providers` | GET | — | `oauth_provider:read` | |
| `/api/oauth-providers` | POST | — | `oauth_provider:create` | |
| `/api/oauth-providers/[id]` | GET | — | `oauth_provider:read` | 含 `clientSecret` |
| `/api/oauth-providers/[id]` | PUT | — | `oauth_provider:update` | |
| `/api/oauth-providers/[id]` | DELETE | — | `oauth_provider:delete` | |

### 未纳入本矩阵的租户相关路由（刻意）

- **`/api/profile*`**、**`/api/tenants`**（租户列表/自助创建）：个人账户或创建租户流程，不按上表 permission 守卫。
- **`/api/platform/*`**：平台只读总览（Issue #4 D1），不靠租户 RBAC。
- **OAuth 协议端点**（`/api/oauth/consent`、`/oauth/*` 等）：授权流程，不使用上表。

## 占位（模块已有，路由待接）

| 能力 | 说明 |
|------|------|
| 删除租户 | `canDeleteTenant`（仅 owner）；删除租户 API 若新增应同时考虑治理与 RBAC |

## 升级与种子

第二波新增 permission 码已写入 **`scripts/seed.mjs`**；默认租户 **`超级管理员`** 角色绑定 **全部** permission，`owner` 用户绑定该角色，避免升级后无法操作后台。**存量库**请在合并代码后执行一次 `pnpm run seed`（幂等 upsert）或编写等价增量 SQL 写入新 `Permission` / `RolePermission` 行。

## 相关代码

- Permission 常量：`src/lib/permission-codes.ts`
- RBAC 查询：`userHasPermission`（`src/lib/data-access.ts`）
- 路由守卫：`guardTenantRbac`（`src/lib/rbac-server.ts`）
- 开关：`enforceTenantRbac`（`src/lib/rbac-env.ts`）
- 审计清单：`src/lib/tenant-route-permissions.ts`
- 单测：`pnpm test`
