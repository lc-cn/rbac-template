import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const url = process.env.DATABASE_URL?.trim()
if (!url?.startsWith('libsql:')) {
  throw new Error(
    'seed 需要 DATABASE_URL 为 LibSQL（libsql://...），与运行时一致。请在 .env 中配置 Turso 地址与 DATABASE_AUTH_TOKEN。'
  )
}
const adapter = new PrismaLibSql({ url, authToken: process.env.DATABASE_AUTH_TOKEN })
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  console.log('开始初始化数据...')

  const app = await prisma.application.upsert({
    where: { code: 'rbac-admin' },
    update: {},
    create: {
      name: 'RBAC 管理系统',
      code: 'rbac-admin',
      description: '权限管理后台',
      status: true,
    },
  })

  const userFeature = await prisma.feature.upsert({
    where: { applicationId_code: { applicationId: app.id, code: 'user-mgmt' } },
    update: {},
    create: {
      name: '用户管理',
      code: 'user-mgmt',
      description: '用户的增删改查',
      applicationId: app.id,
    },
  })

  const roleFeature = await prisma.feature.upsert({
    where: { applicationId_code: { applicationId: app.id, code: 'role-mgmt' } },
    update: {},
    create: {
      name: '角色管理',
      code: 'role-mgmt',
      description: '角色的增删改查',
      applicationId: app.id,
    },
  })

  const permFeature = await prisma.feature.upsert({
    where: { applicationId_code: { applicationId: app.id, code: 'perm-mgmt' } },
    update: {},
    create: {
      name: '权限管理',
      code: 'perm-mgmt',
      description: '权限的增删改查',
      applicationId: app.id,
    },
  })

  const permissionsData = [
    { name: '查看用户', code: 'user:read', featureId: userFeature.id },
    { name: '创建用户', code: 'user:create', featureId: userFeature.id },
    { name: '编辑用户', code: 'user:update', featureId: userFeature.id },
    { name: '删除用户', code: 'user:delete', featureId: userFeature.id },
    { name: '查看角色', code: 'role:read', featureId: roleFeature.id },
    { name: '创建角色', code: 'role:create', featureId: roleFeature.id },
    { name: '编辑角色', code: 'role:update', featureId: roleFeature.id },
    { name: '删除角色', code: 'role:delete', featureId: roleFeature.id },
    { name: '查看权限', code: 'perm:read', featureId: permFeature.id },
    { name: '创建权限', code: 'perm:create', featureId: permFeature.id },
    { name: '编辑权限', code: 'perm:update', featureId: permFeature.id },
    { name: '删除权限', code: 'perm:delete', featureId: permFeature.id },
  ]

  const createdPermissions = []
  for (const p of permissionsData) {
    const perm = await prisma.permission.upsert({
      where: { code: p.code },
      update: {},
      create: p,
    })
    createdPermissions.push(perm)
  }

  const adminRole = await prisma.role.upsert({
    where: { name: '超级管理员' },
    update: {},
    create: {
      name: '超级管理员',
      description: '拥有系统全部权限',
    },
  })

  for (const perm of createdPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id },
    })
  }

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: '系统管理员',
      email: 'admin@example.com',
      password: 'admin123',
      status: true,
    },
  })

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id },
  })

  await prisma.oAuthProvider.upsert({
    where: { name: 'GitHub' },
    update: {},
    create: {
      name: 'GitHub',
      type: 'github',
      clientId: 'your-github-client-id',
      clientSecret: 'your-github-client-secret',
      enabled: false,
    },
  })

  await prisma.oAuthProvider.upsert({
    where: { name: '微信' },
    update: {},
    create: {
      name: '微信',
      type: 'wechat',
      clientId: 'your-wechat-app-id',
      clientSecret: 'your-wechat-app-secret',
      enabled: false,
    },
  })

  const systemConfigs = [
    { key: 'site_name', value: 'RBAC 管理系统', group: 'general', label: '站点名称' },
    { key: 'site_url', value: 'http://localhost:3000', group: 'general', label: '站点URL' },
    { key: 'admin_email', value: 'admin@example.com', group: 'general', label: '管理员邮箱' },
    { key: 'session_timeout', value: '3600', group: 'general', label: '会话超时(秒)' },
  ]

  for (const config of systemConfigs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    })
  }

  console.log('数据初始化完成!')
  console.log('管理员账号: admin@example.com / admin123')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
