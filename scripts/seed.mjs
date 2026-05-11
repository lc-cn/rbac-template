/**
 * 使用 @libsql/client 初始化种子数据（不再依赖 Prisma）。
 * 用法：pnpm run seed（需 .env 中 DATABASE_URL=libsql://... 与 DATABASE_AUTH_TOKEN）
 */
import 'dotenv/config'
import { createClient } from '@libsql/client'
import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'

const url = process.env.DATABASE_URL?.trim()
if (!url?.startsWith('libsql:')) {
  console.error('seed 需要 DATABASE_URL 为 LibSQL（libsql://...）')
  process.exit(1)
}

const db = createClient({
  url,
  authToken: process.env.DATABASE_AUTH_TOKEN,
})

const now = () => new Date().toISOString()

/** 与迁移 006 / schema.sql 默认租户一致 */
const DEFAULT_TENANT_ID = 'tenant_default'

async function ensureDefaultTenant() {
  const t = now()
  await db.execute({
    sql: `INSERT OR IGNORE INTO "Tenant" ("id","name","slug","createdAt","updatedAt") VALUES (?,?,?,?,?)`,
    args: [DEFAULT_TENANT_ID, '默认组织', 'default', t, t],
  })
}

/** Application 按租户 + code upsert */
async function upsertApplication() {
  const code = 'rbac-admin'
  const r = await db.execute({
    sql: `SELECT * FROM "Application" WHERE "tenantId" = ? AND "code" = ?`,
    args: [DEFAULT_TENANT_ID, code],
  })
  if (r.rows[0]) return r.rows[0]
  const id = randomUUID()
  const t = now()
  await db.execute({
    sql: `INSERT INTO "Application" ("id","name","code","description","status","tenantId","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?,?)`,
    args: [id, 'RBAC 管理系统', code, '权限管理后台', 1, DEFAULT_TENANT_ID, t, t],
  })
  const out = await db.execute({ sql: `SELECT * FROM "Application" WHERE "id" = ?`, args: [id] })
  return out.rows[0]
}

async function upsertFeature(appId, code, name, desc) {
  const r = await db.execute({
    sql: `SELECT * FROM "Feature" WHERE "applicationId" = ? AND "code" = ?`,
    args: [appId, code],
  })
  if (r.rows[0]) return r.rows[0]
  const id = randomUUID()
  const t = now()
  await db.execute({
    sql: `INSERT INTO "Feature" ("id","name","code","description","applicationId","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?)`,
    args: [id, name, code, desc, appId, t, t],
  })
  const out = await db.execute({ sql: `SELECT * FROM "Feature" WHERE "id" = ?`, args: [id] })
  return out.rows[0]
}

async function upsertPermission(featureId, code, name) {
  const r = await db.execute({
    sql: `SELECT * FROM "Permission" WHERE "featureId" = ? AND "code" = ?`,
    args: [featureId, code],
  })
  if (r.rows[0]) return r.rows[0]
  const id = randomUUID()
  const t = now()
  await db.execute({
    sql: `INSERT INTO "Permission" ("id","name","code","description","featureId","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?)`,
    args: [id, name, code, null, featureId, t, t],
  })
  const out = await db.execute({ sql: `SELECT * FROM "Permission" WHERE "id" = ?`, args: [id] })
  return out.rows[0]
}

async function upsertRole(name, desc) {
  const r = await db.execute({
    sql: `SELECT * FROM "Role" WHERE "tenantId" = ? AND "name" = ?`,
    args: [DEFAULT_TENANT_ID, name],
  })
  if (r.rows[0]) return r.rows[0]
  const id = randomUUID()
  const t = now()
  await db.execute({
    sql: `INSERT INTO "Role" ("id","name","description","tenantId","createdAt","updatedAt") VALUES (?,?,?,?,?,?)`,
    args: [id, name, desc, DEFAULT_TENANT_ID, t, t],
  })
  const out = await db.execute({ sql: `SELECT * FROM "Role" WHERE "id" = ?`, args: [id] })
  return out.rows[0]
}

async function upsertRolePerm(roleId, permId) {
  const t = now()
  await db.execute({
    sql: `INSERT OR IGNORE INTO "RolePermission" ("roleId","permissionId","createdAt") VALUES (?,?,?)`,
    args: [roleId, permId, t],
  })
}

async function upsertUser(email, data) {
  const r = await db.execute({ sql: `SELECT * FROM "User" WHERE "email" = ?`, args: [email] })
  if (r.rows[0]) return r.rows[0]
  const id = randomUUID()
  const t = now()
  const isAdmin = email === 'admin@example.com' ? 1 : 0
  await db.execute({
    sql: `INSERT INTO "User" ("id","name","email","emailVerified","image","password","avatar","status","isPlatformAdmin","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    args: [id, data.name, email, null, null, data.password, null, 1, isAdmin, t, t],
  })
  const out = await db.execute({ sql: `SELECT * FROM "User" WHERE "id" = ?`, args: [id] })
  return out.rows[0]
}

async function upsertUserTenantOwner(userId, tenantId) {
  const t = now()
  await db.execute({
    sql: `INSERT INTO "UserTenant" ("userId","tenantId","tenantRole","createdAt") VALUES (?,?,?,?)
          ON CONFLICT("userId", "tenantId") DO UPDATE SET "tenantRole" = excluded."tenantRole"`,
    args: [userId, tenantId, 'owner', t],
  })
}

async function upsertUserRole(userId, roleId) {
  const t = now()
  await db.execute({
    sql: `INSERT OR IGNORE INTO "UserRole" ("userId","roleId","createdAt") VALUES (?,?,?)`,
    args: [userId, roleId, t],
  })
}

async function upsertOAuth(name, type, cid, sec, enabled) {
  const r = await db.execute({ sql: `SELECT * FROM "OAuthProvider" WHERE "name" = ?`, args: [name] })
  const t = now()
  if (r.rows[0]) {
    await db.execute({
      sql: `UPDATE "OAuthProvider" SET "type"=?, "clientId"=?, "clientSecret"=?, "enabled"=?, "updatedAt"=? WHERE "name"=?`,
      args: [type, cid, sec, enabled ? 1 : 0, t, name],
    })
    return
  }
  const id = randomUUID()
  await db.execute({
    sql: `INSERT INTO "OAuthProvider" ("id","name","type","clientId","clientSecret","enabled","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?,?)`,
    args: [id, name, type, cid, sec, enabled ? 1 : 0, t, t],
  })
}

async function upsertSystemConfig(key, value, group, label) {
  const r = await db.execute({ sql: `SELECT "id" FROM "SystemConfig" WHERE "key" = ?`, args: [key] })
  const t = now()
  if (r.rows[0]) {
    await db.execute({
      sql: `UPDATE "SystemConfig" SET "value"=?, "group"=?, "label"=?, "updatedAt"=? WHERE "key"=?`,
      args: [value, group, label, t, key],
    })
    return
  }
  const id = randomUUID()
  await db.execute({
    sql: `INSERT INTO "SystemConfig" ("id","key","value","group","label","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?)`,
    args: [id, key, value, group, label, t, t],
  })
}

async function main() {
  console.log('开始初始化数据...')

  await ensureDefaultTenant()

  const app = await upsertApplication()
  const appId = String(app.id)

  const userFeature = await upsertFeature(appId, 'user-mgmt', '用户管理', '用户的增删改查')
  const roleFeature = await upsertFeature(appId, 'role-mgmt', '角色管理', '角色的增删改查')
  const permFeature = await upsertFeature(appId, 'perm-mgmt', '权限管理', '权限的增删改查')

  const permissionsData = [
    ['user:read', '查看用户', userFeature.id],
    ['user:create', '创建用户', userFeature.id],
    ['user:update', '编辑用户', userFeature.id],
    ['user:delete', '删除用户', userFeature.id],
    ['role:read', '查看角色', roleFeature.id],
    ['role:create', '创建角色', roleFeature.id],
    ['role:update', '编辑角色', roleFeature.id],
    ['role:delete', '删除角色', roleFeature.id],
    ['perm:read', '查看权限', permFeature.id],
    ['perm:create', '创建权限', permFeature.id],
    ['perm:update', '编辑权限', permFeature.id],
    ['perm:delete', '删除权限', permFeature.id],
  ]

  const createdPerms = []
  for (const [code, name, fid] of permissionsData) {
    createdPerms.push(await upsertPermission(String(fid), code, name))
  }

  const adminRole = await upsertRole('超级管理员', '拥有系统全部权限')
  for (const perm of createdPerms) {
    await upsertRolePerm(String(adminRole.id), String(perm.id))
  }

  const adminUser = await upsertUser('admin@example.com', {
    name: '系统管理员',
    password: 'admin123',
  })
  await upsertUserTenantOwner(String(adminUser.id), DEFAULT_TENANT_ID)
  await upsertUserRole(String(adminUser.id), String(adminRole.id))

  await upsertOAuth('GitHub', 'github', 'your-github-client-id', 'your-github-client-secret', false)
  await upsertOAuth('微信', 'wechat', 'your-wechat-app-id', 'your-wechat-app-secret', false)

  await upsertSystemConfig('site_name', 'RBAC 管理系统', 'general', '站点名称')
  await upsertSystemConfig('site_url', 'http://localhost:3000', 'general', '站点URL')
  await upsertSystemConfig('admin_email', 'admin@example.com', 'general', '管理员邮箱')
  await upsertSystemConfig('session_timeout', '3600', 'general', '会话超时(秒)')

  await seedOAuth2DemoClient()

  console.log('数据初始化完成!')
  console.log('管理员账号: admin@example.com / admin123')
}

/** 示例应用 + OIDC 客户端（OAuth2Client.applicationId 关联 Application；生产务必改密与 redirect） */
async function seedOAuth2DemoClient() {
  const clientId = 'rbac_demo_client'
  const existing = await db.execute({ sql: `SELECT "id" FROM "OAuth2Client" WHERE "clientId" = ?`, args: [clientId] })
  if (existing.rows[0]) return

  const appId = randomUUID()
  const oauthId = randomUUID()
  const t = now()
  const secretHash = bcrypt.hashSync('demo_secret_please_change', 10)
  const redirectUrisJson = JSON.stringify([
    'http://localhost:5173/oauth/callback',
    'http://127.0.0.1:5173/oauth/callback',
  ])
  await db.execute({
    sql: `INSERT INTO "Application" ("id","name","code","description","status","tenantId","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?,?)`,
    args: [appId, '示例第三方应用', clientId, null, 1, DEFAULT_TENANT_ID, t, t],
  })
  await db.execute({
    sql: `INSERT INTO "OAuth2Client" (
      "id","applicationId","clientId","clientSecretHash","redirectUrisJson","allowedScopes",
      "postLogoutRedirectUrisJson","allowedGrantTypes",
      "accessTokenTtlSeconds","refreshTokenTtlDays","authorizationCodeTtlMinutes",
      "createdAt","updatedAt"
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [
      oauthId,
      appId,
      clientId,
      secretHash,
      redirectUrisJson,
      'openid profile email offline_access',
      '[]',
      'authorization_code,refresh_token',
      3600,
      30,
      10,
      t,
      t,
    ],
  })
  console.log(
    '已注册示例应用（含 OIDC）client_id=rbac_demo_client，client_secret=demo_secret_please_change，回调见 OAuth2Client.redirectUrisJson'
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.close())
