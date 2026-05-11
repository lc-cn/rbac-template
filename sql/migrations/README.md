# SQL 迁移约定

- **改表结构**：在仓库里新增 `NNN_描述.sql`（递增序号），写可重复的 `IF NOT EXISTS` / `INSERT ... WHERE NOT EXISTS` 等，避免破坏已执行过的环境。
- **`../schema.sql`**：空库一键建表的**聚合 DDL**，应与「002→…→最新迁移」执行后的**最终结构一致**。发迁移后请把 `schema.sql` 同步到同一终点，而不是只在 `schema.sql` 里改、不写迁移。
- **已有库升级**：对未执行过的迁移文件逐个执行  
  `pnpm run db:apply-sql sql/migrations/NNN_....sql`  
  （本目录内 002～004 为历史补齐；005 仅当 `Application` 上仍存在 `oauthClientId` 等列时使用；**007** 为 Issue #6 第三波协作与生命周期表结构，存量库在合并对应代码后按需执行；**008** 下线控制台 OAuth：删 `OAuthProvider` 表及相关 RBAC 权限与 OAuth 登录 `Account` 行。**009** 为 Issue #8：Passkey、MFA、备份码、限流桶、挑战表、核选项恢复、`User.credentialVersion`。）
