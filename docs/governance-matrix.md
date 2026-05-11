# 租户治理矩阵（H2 第一波）

本文档与 `CONTEXT.md` 术语一致，对应 GitHub Issue #4：**租户治理（`UserTenant.tenantRole`）与租户内成员高危 API 对齐**；**业务 RBAC（`Role` / `UserRole` / Permission）为另一维度**，第二波再系统收紧。

## 规则摘要

| 维度 | 说明 |
|------|------|
| **治理** | `owner` / `admin` / `member`：加人、踢人、改他人治理级角色、租户级用户资料与 RBAC 绑定（本期通过 `/api/users`） |
| **RBAC** | 业务权限码；member 可能具备强业务权限，但**不能**越过治理规则执行上表高危操作（第一波 **治理优先**） |
| **平台管理员** | `isPlatformAdmin`：仅 **无 `currentTenantId`** 时只读总览（`/platform`、`/api/platform/*`）；**进入租户后无豁免**，须具备 `UserTenant` 且遵守本矩阵（E1 / D1） |

## 第一波已守卫的 API

| 端点 | 所需 `tenantRole` | 错误码（403） | 备注 |
|------|-------------------|----------------|------|
| `POST /api/users` | `owner` 或 `admin` | `forbidden_governance` / `forbidden_not_tenant_member` | 创建用户并写入 `UserTenant`（默认 `member`） |
| `DELETE /api/users/[id]` | `owner` 或 `admin`；**不可**移除 `owner` 行 | `forbidden_governance` / `forbidden_cannot_remove_owner` | 与踢人语义一致（I1） |
| `PUT /api/users/[id]` | `owner` 或 `admin` | `forbidden_governance` | 修改租户内用户资料与 RBAC 角色绑定；**member 不可用本接口**（个人资料用 `PATCH /api/profile`） |
| `PUT /api/users/[id]` body `tenantRole` | `owner` 或 `admin`；目标 **不得** 为 `owner`；仅允许 `admin` ↔ `member` | `forbidden_owner_only` / `forbidden_ownership_transfer_not_supported` / `forbidden_invalid_tenant_role` | owner 移交未在本期实现；勿把 member 提为 owner |

**会话与数据源**：写操作前以数据库 `UserTenant` 解析操作者角色，**不信任**客户端自报；403 响应体为 `{ "error": "<稳定码>" }`。

## 占位（模块已覆盖，路由待接）

| 能力 | 策略函数 | 说明 |
|------|-----------|------|
| 删除租户 | `canDeleteTenant` | 仅 `owner`；删除租户 API 若后续新增，应直接复用 |

## 第二波及以后（未收紧 / 仍主要依赖 RBAC 或待设计）

以下端点本期 **未** 按业务 Permission 全量守卫（见 Issue #5 及后续 PRD）；集成方应知晓边界：

- `GET /api/users`、`GET /api/users/[id]`：须已登录且具备当前租户上下文；**未**按 RBAC 过滤列表（可按资源域逐批加守卫）。
- `GET/POST/PUT/DELETE`：`/api/roles`、`/api/permissions`、`/api/features`、`/api/applications`、`/api/oauth-providers`、`/api/system-config` 等租户内业务 API — **仍以租户隔离为主**，Permission 码对齐为第二波。
- 页面层：成员是否看到「用户管理」菜单 — 可与 API 互补分期处理。

## 推荐第二波顺序（简述）

1. 按资源域（用户 / 角色 / 应用…）为 **业务 API** 增加 Permission 检查中间层或共享 helper。  
2. 列表类 `GET` 与 UI 入口与 RBAC 对齐，避免「前端隐藏但 API 仍可达」的长期偏差。  
3. owner 移交：独立事务与审计钩子，再解锁 `tenantRole: owner` 相关路径。

## 相关代码

- 治理判定（可单测）：`src/lib/governance-policy.ts`
- 路由适配（会话 + DB 成员关系）：`src/lib/governance-server.ts`
- 单测：`pnpm test src/lib/governance-policy.test.ts`
