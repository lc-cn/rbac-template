# 领域词汇（CONTEXT）

本文件概括 Issue #2（多租户 PRD）引入的概念，供实现与 ADR 引用。

## 租户（Tenant）

组织边界；逻辑多租户通过共享库 + 行级 `tenantId`（及 `UserTenant` 等作用域）实现。

## slug

租户全局唯一、稳定的小写标识（链接、日志、对接）；第一期创建后**不可修改**（改名 / `tenant_slug_history` 不在本期范围）。

## 租户级角色（tenantRole）

`UserTenant.tenantRole`：`owner` | `admin` | `member`。用于**组织治理**（邀请、租户设置等语义预留），与 RBAC 业务角色（`Role` / `UserRole`）正交。每个租户**同时仅一名 owner**（部分唯一索引保障）。治理规则与已守卫 API 清单见 [`docs/governance-matrix.md`](docs/governance-matrix.md)。

## 业务 RBAC（第二波）

租户内 API 在具备成员资格的基础上，按 **`Permission.code`** 校验（`UserRole` → `Role` → `RolePermission`）；缺少权限时 HTTP **403**、`{ "error": "forbidden_permission" }`。详见 [`docs/governance-matrix.md`](docs/governance-matrix.md)。

## 平台管理员（isPlatformAdmin）

`User.isPlatformAdmin`；可进入**无 `currentTenantId`** 的**只读**跨租户总览（`/platform`、`/api/platform/*`）。业务写入仍须先进入目标租户（会话携带 `currentTenantId`）。

## 当前租户上下文

仅通过 **Auth.js JWT / session** 传递 `currentTenantId`（及 `tenantRole`、`isPlatformAdmin`）；**不**用 Cookie 双写。客户端通过 `update({ currentTenantId })` 切换租户，服务端在 `jwt` 回调中校验 `UserTenant` 成员关系。

## 环境变量

- `ALLOW_SELF_SERVICE_TENANT_CREATE`：为 `0` / `false` / `no` / `off` 时禁止通过 `POST /api/tenants` 自助创建租户；否则允许（默认允许，便于演示）。

## 创建组织（租户）的入口

- 未加入任何租户时：登录后进入 **`/no-tenant`**，在自助策略允许时展示**创建表单**（名称 + 可选 slug），提交后调用 `POST /api/tenants` 并 `update({ currentTenantId })` 进入该组织。
- 已加入租户、仍需再建新组织：访问 **`/organizations/new`**（顶栏租户菜单内「新建组织」），无需先切换租户上下文；创建成功后自动切换到新租户。
- 关闭自助创建时：上述表单隐藏说明文案，仅能通过运维/平台侧另行接入（例如后续「仅平台创建」管理 API）。

## 升级说明

存量库执行 `sql/migrations/006_multi_tenant.sql`（或从新库应用聚合后的 `sql/schema.sql`）。务必事先备份。迁移将创建默认租户 `tenant_default`、回填 `Application`/`Role` 的租户列，并通过 `UserTenant` + `SystemConfig.admin_email` 建立 owner 与平台管理员标记。
