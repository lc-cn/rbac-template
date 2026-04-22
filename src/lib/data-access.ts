import { getDb, newId, nowIso, boolFromSql, isUniqueConstraintError } from '@/lib/db'

export { isUniqueConstraintError }

/** @libsql/client execute 参数类型 */
type SqlArg = string | number | bigint | boolean | null
type SqlArgs = SqlArg[]

function mapApp(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    name: String(row.name),
    code: String(row.code),
    description: row.description == null ? null : String(row.description),
    status: boolFromSql(row.status),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  }
}

function mapFeature(row: Record<string, unknown>, application?: ReturnType<typeof mapApp>) {
  return {
    id: String(row.id),
    name: String(row.name),
    code: String(row.code),
    description: row.description == null ? null : String(row.description),
    applicationId: String(row.applicationId),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
    ...(application ? { application } : {}),
  }
}

function mapPermission(row: Record<string, unknown>, feature?: unknown) {
  return {
    id: String(row.id),
    name: String(row.name),
    code: String(row.code),
    description: row.description == null ? null : String(row.description),
    featureId: String(row.featureId),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
    ...(feature !== undefined ? { feature } : {}),
  }
}

function mapRole(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    name: String(row.name),
    description: row.description == null ? null : String(row.description),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  }
}

function mapUserRow(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    emailVerified: row.emailVerified == null ? null : String(row.emailVerified),
    image: row.image == null ? null : String(row.image),
    password: row.password == null ? null : String(row.password),
    avatar: row.avatar == null ? null : String(row.avatar),
    status: boolFromSql(row.status),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  }
}

async function loadFeaturesWithPermissionsForAppIds(applicationIds: string[]) {
  if (applicationIds.length === 0) return { features: [] as Record<string, unknown>[], permsByFeature: new Map<string, unknown[]>() }
  const db = getDb()
  const placeholders = applicationIds.map(() => '?').join(',')
  const fr = await db.execute({
    sql: `SELECT * FROM "Feature" WHERE "applicationId" IN (${placeholders}) ORDER BY "createdAt" DESC`,
    args: applicationIds,
  })
  const features = fr.rows as unknown as Record<string, unknown>[]
  const featureIds = features.map((f) => String(f.id))
  const permsByFeature = new Map<string, unknown[]>()
  if (featureIds.length === 0) return { features, permsByFeature }
  const ph2 = featureIds.map(() => '?').join(',')
  const pr = await db.execute({
    sql: `SELECT * FROM "Permission" WHERE "featureId" IN (${ph2})`,
    args: featureIds,
  })
  for (const p of pr.rows as unknown as Record<string, unknown>[]) {
    const fid = String(p.featureId)
    if (!permsByFeature.has(fid)) permsByFeature.set(fid, [])
    permsByFeature.get(fid)!.push(mapPermission(p))
  }
  return { features, permsByFeature }
}

export async function listApplications(search: string) {
  const db = getDb()
  let sql = `SELECT * FROM "Application"`
  const args: SqlArgs = []
  if (search) {
    sql += ` WHERE "name" LIKE ? OR "code" LIKE ?`
    const p = `%${search.replace(/%/g, '')}%`
    args.push(p, p)
  }
  sql += ` ORDER BY "createdAt" DESC`
  const r = await db.execute({ sql, args })
  const apps = (r.rows as unknown as Record<string, unknown>[]).map(mapApp)
  const ids = apps.map((a) => a.id)
  const { features, permsByFeature } = await loadFeaturesWithPermissionsForAppIds(ids)
  const featsByApp = new Map<string, ReturnType<typeof mapFeature>[]>()
  for (const f of features) {
    const aid = String(f.applicationId)
    if (!featsByApp.has(aid)) featsByApp.set(aid, [])
    const perms = (permsByFeature.get(String(f.id)) ?? []) as ReturnType<typeof mapPermission>[]
    featsByApp.get(aid)!.push(Object.assign(mapFeature(f), { permissions: perms }))
  }
  return apps.map((a) => ({ ...a, features: featsByApp.get(a.id) ?? [] }))
}

export async function getApplicationById(id: string) {
  const db = getDb()
  const r = await db.execute({ sql: `SELECT * FROM "Application" WHERE "id" = ?`, args: [id] })
  const row = r.rows[0] as unknown as Record<string, unknown> | undefined
  if (!row) return null
  const app = mapApp(row)
  const { features, permsByFeature } = await loadFeaturesWithPermissionsForAppIds([id])
  const feats = features.map((f) => ({
    ...mapFeature(f),
    permissions: (permsByFeature.get(String(f.id)) ?? []) as ReturnType<typeof mapPermission>[],
  }))
  return { ...app, features: feats }
}

export async function createApplication(input: {
  name: string
  code: string
  description?: string | null
  status?: boolean
}) {
  const db = getDb()
  const id = newId()
  const t = nowIso()
  const st = input.status === false ? 0 : 1
  await db.execute({
    sql: `INSERT INTO "Application" ("id","name","code","description","status","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?)`,
    args: [id, input.name, input.code, input.description ?? null, st, t, t],
  })
  return getApplicationById(id)
}

export async function updateApplication(
  id: string,
  data: { name: string; code: string; description?: string | null; status?: boolean }
) {
  const db = getDb()
  const t = nowIso()
  const st = data.status === false ? 0 : 1
  await db.execute({
    sql: `UPDATE "Application" SET "name"=?, "code"=?, "description"=?, "status"=?, "updatedAt"=? WHERE "id"=?`,
    args: [data.name, data.code, data.description ?? null, st, t, id],
  })
  return getApplicationById(id)
}

export async function deleteApplication(id: string) {
  const db = getDb()
  await db.execute({ sql: `DELETE FROM "Application" WHERE "id" = ?`, args: [id] })
}

export async function listFeatures(search: string, applicationId: string) {
  const db = getDb()
  let sql = `SELECT f.*, a."id" as a_id, a."name" as a_name, a."code" as a_code, a."description" as a_description, a."status" as a_status, a."createdAt" as a_createdAt, a."updatedAt" as a_updatedAt
              FROM "Feature" f JOIN "Application" a ON a."id" = f."applicationId"`
  const args: SqlArgs = []
  const cond: string[] = []
  if (applicationId) {
    cond.push(`f."applicationId" = ?`)
    args.push(applicationId)
  }
  if (search) {
    cond.push(`(f."name" LIKE ? OR f."code" LIKE ?)`)
    const p = `%${search.replace(/%/g, '')}%`
    args.push(p, p)
  }
  if (cond.length) sql += ` WHERE ${cond.join(' AND ')}`
  sql += ` ORDER BY f."createdAt" DESC`
  const r = await db.execute({ sql, args })
  const out = []
  for (const row of r.rows as unknown as Record<string, unknown>[]) {
    const application = mapApp({
      id: row.a_id,
      name: row.a_name,
      code: row.a_code,
      description: row.a_description,
      status: row.a_status,
      createdAt: row.a_createdAt,
      updatedAt: row.a_updatedAt,
    })
    const fid = String(row.id)
    const pr = await db.execute({ sql: `SELECT * FROM "Permission" WHERE "featureId" = ?`, args: [fid] })
    const permissions = (pr.rows as unknown as Record<string, unknown>[]).map((p) => mapPermission(p))
    out.push({ ...mapFeature(row), application, permissions })
  }
  return out
}

export async function getFeatureById(id: string) {
  const db = getDb()
  const r = await db.execute({
    sql: `SELECT f.*, a."id" as a_id, a."name" as a_name, a."code" as a_code, a."description" as a_description, a."status" as a_status, a."createdAt" as a_createdAt, a."updatedAt" as a_updatedAt
          FROM "Feature" f JOIN "Application" a ON a."id" = f."applicationId" WHERE f."id" = ?`,
    args: [id],
  })
  const row = r.rows[0] as unknown as Record<string, unknown> | undefined
  if (!row) return null
  const application = mapApp({
    id: row.a_id,
    name: row.a_name,
    code: row.a_code,
    description: row.a_description,
    status: row.a_status,
    createdAt: row.a_createdAt,
    updatedAt: row.a_updatedAt,
  })
  const pr = await db.execute({ sql: `SELECT * FROM "Permission" WHERE "featureId" = ?`, args: [id] })
  const permissions = (pr.rows as unknown as Record<string, unknown>[]).map((p) => mapPermission(p))
  return { ...mapFeature(row), application, permissions }
}

export async function createFeature(input: {
  name: string
  code: string
  description?: string | null
  applicationId: string
}) {
  const db = getDb()
  const id = newId()
  const t = nowIso()
  await db.execute({
    sql: `INSERT INTO "Feature" ("id","name","code","description","applicationId","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?)`,
    args: [id, input.name, input.code, input.description ?? null, input.applicationId, t, t],
  })
  return getFeatureById(id)
}

export async function updateFeature(
  id: string,
  data: { name: string; code: string; description?: string | null; applicationId: string }
) {
  const db = getDb()
  const t = nowIso()
  await db.execute({
    sql: `UPDATE "Feature" SET "name"=?, "code"=?, "description"=?, "applicationId"=?, "updatedAt"=? WHERE "id"=?`,
    args: [data.name, data.code, data.description ?? null, data.applicationId, t, id],
  })
  return getFeatureById(id)
}

export async function deleteFeature(id: string) {
  const db = getDb()
  await db.execute({ sql: `DELETE FROM "Feature" WHERE "id" = ?`, args: [id] })
}

export async function listPermissions(search: string, featureId: string) {
  const db = getDb()
  let sql = `SELECT p.*, f."id" as f_id, f."name" as f_name, f."code" as f_code, f."description" as f_description, f."applicationId" as f_applicationId, f."createdAt" as f_createdAt, f."updatedAt" as f_updatedAt,
              a."id" as app_id, a."name" as app_name, a."code" as app_code, a."description" as app_description, a."status" as app_status, a."createdAt" as app_createdAt, a."updatedAt" as app_updatedAt
              FROM "Permission" p
              JOIN "Feature" f ON f."id" = p."featureId"
              JOIN "Application" a ON a."id" = f."applicationId"`
  const args: SqlArgs = []
  const cond: string[] = []
  if (featureId) {
    cond.push(`p."featureId" = ?`)
    args.push(featureId)
  }
  if (search) {
    cond.push(`(p."name" LIKE ? OR p."code" LIKE ?)`)
    const p = `%${search.replace(/%/g, '')}%`
    args.push(p, p)
  }
  if (cond.length) sql += ` WHERE ${cond.join(' AND ')}`
  sql += ` ORDER BY p."createdAt" DESC`
  const r = await db.execute({ sql, args })
  return (r.rows as unknown as Record<string, unknown>[]).map((row) => {
    const feature = mapFeature(
      {
        id: row.f_id,
        name: row.f_name,
        code: row.f_code,
        description: row.f_description,
        applicationId: row.f_applicationId,
        createdAt: row.f_createdAt,
        updatedAt: row.f_updatedAt,
      },
      mapApp({
        id: row.app_id,
        name: row.app_name,
        code: row.app_code,
        description: row.app_description,
        status: row.app_status,
        createdAt: row.app_createdAt,
        updatedAt: row.app_updatedAt,
      })
    )
    return mapPermission(row, feature)
  })
}

export async function getPermissionById(id: string) {
  const db = getDb()
  const r = await db.execute({
    sql: `SELECT p.*, f."id" as f_id, f."name" as f_name, f."code" as f_code, f."description" as f_description, f."applicationId" as f_applicationId, f."createdAt" as f_createdAt, f."updatedAt" as f_updatedAt,
              a."id" as app_id, a."name" as app_name, a."code" as app_code, a."description" as app_description, a."status" as app_status, a."createdAt" as app_createdAt, a."updatedAt" as app_updatedAt
              FROM "Permission" p
              JOIN "Feature" f ON f."id" = p."featureId"
              JOIN "Application" a ON a."id" = f."applicationId"
              WHERE p."id" = ?`,
    args: [id],
  })
  const row = r.rows[0] as unknown as Record<string, unknown> | undefined
  if (!row) return null
  const feature = mapFeature(
    {
      id: row.f_id,
      name: row.f_name,
      code: row.f_code,
      description: row.f_description,
      applicationId: row.f_applicationId,
      createdAt: row.f_createdAt,
      updatedAt: row.f_updatedAt,
    },
    mapApp({
      id: row.app_id,
      name: row.app_name,
      code: row.app_code,
      description: row.app_description,
      status: row.app_status,
      createdAt: row.app_createdAt,
      updatedAt: row.app_updatedAt,
    })
  )
  return mapPermission(row, feature)
}

export async function createPermission(input: {
  name: string
  code: string
  description?: string | null
  featureId: string
}) {
  const db = getDb()
  const id = newId()
  const t = nowIso()
  await db.execute({
    sql: `INSERT INTO "Permission" ("id","name","code","description","featureId","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?)`,
    args: [id, input.name, input.code, input.description ?? null, input.featureId, t, t],
  })
  return getPermissionById(id)
}

export async function updatePermission(
  id: string,
  data: { name: string; code: string; description?: string | null; featureId: string }
) {
  const db = getDb()
  const t = nowIso()
  await db.execute({
    sql: `UPDATE "Permission" SET "name"=?, "code"=?, "description"=?, "featureId"=?, "updatedAt"=? WHERE "id"=?`,
    args: [data.name, data.code, data.description ?? null, data.featureId, t, id],
  })
  return getPermissionById(id)
}

export async function deletePermission(id: string) {
  const db = getDb()
  await db.execute({ sql: `DELETE FROM "Permission" WHERE "id" = ?`, args: [id] })
}

async function attachRoleRelations(roles: ReturnType<typeof mapRole>[]) {
  const db = getDb()
  const ids = roles.map((r) => r.id)
  if (!ids.length) return roles.map((r) => ({ ...r, users: [] as unknown[], permissions: [] as unknown[] }))
  const ph = ids.map(() => '?').join(',')
  const ur = await db.execute({
    sql: `SELECT ur.*, u."id" as u_id, u."name" as u_name, u."email" as u_email, u."emailVerified" as u_emailVerified, u."image" as u_image, u."password" as u_password, u."avatar" as u_avatar, u."status" as u_status, u."createdAt" as u_createdAt, u."updatedAt" as u_updatedAt
          FROM "UserRole" ur JOIN "User" u ON u."id" = ur."userId" WHERE ur."roleId" IN (${ph})`,
    args: ids,
  })
  const rp = await db.execute({
    sql: `SELECT rp.*, p."id" as p_id, p."name" as p_name, p."code" as p_code, p."description" as p_description, p."featureId" as p_featureId, p."createdAt" as p_createdAt, p."updatedAt" as p_updatedAt
          FROM "RolePermission" rp JOIN "Permission" p ON p."id" = rp."permissionId" WHERE rp."roleId" IN (${ph})`,
    args: ids,
  })
  const usersByRole = new Map<string, unknown[]>()
  for (const row of ur.rows as unknown as Record<string, unknown>[]) {
    const rid = String(row.roleId)
    if (!usersByRole.has(rid)) usersByRole.set(rid, [])
    usersByRole.get(rid)!.push({
      userId: String(row.userId),
      roleId: String(row.roleId),
      createdAt: String(row.createdAt),
      user: mapUserRow({
        id: row.u_id,
        name: row.u_name,
        email: row.u_email,
        emailVerified: row.u_emailVerified,
        image: row.u_image,
        password: row.u_password,
        avatar: row.u_avatar,
        status: row.u_status,
        createdAt: row.u_createdAt,
        updatedAt: row.u_updatedAt,
      }),
    })
  }
  const permsByRole = new Map<string, unknown[]>()
  for (const row of rp.rows as unknown as Record<string, unknown>[]) {
    const rid = String(row.roleId)
    if (!permsByRole.has(rid)) permsByRole.set(rid, [])
    permsByRole.get(rid)!.push({
      roleId: String(row.roleId),
      permissionId: String(row.permissionId),
      createdAt: String(row.createdAt),
      permission: mapPermission({
        id: row.p_id,
        name: row.p_name,
        code: row.p_code,
        description: row.p_description,
        featureId: row.p_featureId,
        createdAt: row.p_createdAt,
        updatedAt: row.p_updatedAt,
      }),
    })
  }
  return roles.map((r) => ({
    ...r,
    users: usersByRole.get(r.id) ?? [],
    permissions: permsByRole.get(r.id) ?? [],
  }))
}

export async function listRoles(search: string) {
  const db = getDb()
  let sql = `SELECT * FROM "Role"`
  const args: SqlArgs = []
  if (search) {
    sql += ` WHERE "name" LIKE ? OR IFNULL("description",'') LIKE ?`
    const p = `%${search.replace(/%/g, '')}%`
    args.push(p, p)
  }
  sql += ` ORDER BY "createdAt" DESC`
  const r = await db.execute({ sql, args })
  const roles = (r.rows as unknown as Record<string, unknown>[]).map(mapRole)
  return attachRoleRelations(roles)
}

export async function getRoleById(id: string) {
  const db = getDb()
  const r = await db.execute({ sql: `SELECT * FROM "Role" WHERE "id" = ?`, args: [id] })
  const row = r.rows[0] as unknown as Record<string, unknown> | undefined
  if (!row) return null
  const [full] = await attachRoleRelations([mapRole(row)])
  return full
}

export async function createRole(input: { name: string; description?: string | null; permissionIds?: string[] }) {
  const db = getDb()
  const id = newId()
  const t = nowIso()
  await db.execute({
    sql: `INSERT INTO "Role" ("id","name","description","createdAt","updatedAt") VALUES (?,?,?,?,?)`,
    args: [id, input.name, input.description ?? null, t, t],
  })
  if (input.permissionIds?.length) {
    for (const pid of input.permissionIds) {
      await db.execute({
        sql: `INSERT INTO "RolePermission" ("roleId","permissionId","createdAt") VALUES (?,?,?)`,
        args: [id, pid, t],
      })
    }
  }
  return getRoleById(id)
}

export async function updateRole(
  id: string,
  data: { name: string; description?: string | null; permissionIds?: string[] }
) {
  const db = getDb()
  const t = nowIso()
  await db.execute({
    sql: `UPDATE "Role" SET "name"=?, "description"=?, "updatedAt"=? WHERE "id"=?`,
    args: [data.name, data.description ?? null, t, id],
  })
  await db.execute({ sql: `DELETE FROM "RolePermission" WHERE "roleId" = ?`, args: [id] })
  if (data.permissionIds?.length) {
    for (const pid of data.permissionIds) {
      await db.execute({
        sql: `INSERT INTO "RolePermission" ("roleId","permissionId","createdAt") VALUES (?,?,?)`,
        args: [id, pid, t],
      })
    }
  }
  return getRoleById(id)
}

export async function deleteRole(id: string) {
  const db = getDb()
  await db.execute({ sql: `DELETE FROM "Role" WHERE "id" = ?`, args: [id] })
}

async function attachUserRoles(users: ReturnType<typeof mapUserRow>[]) {
  const db = getDb()
  const ids = users.map((u) => u.id)
  if (!ids.length) return users.map((u) => ({ ...u, roles: [] as unknown[] }))
  const ph = ids.map(() => '?').join(',')
  const rr = await db.execute({
    sql: `SELECT ur.*, r."id" as r_id, r."name" as r_name, r."description" as r_description, r."createdAt" as r_createdAt, r."updatedAt" as r_updatedAt
          FROM "UserRole" ur JOIN "Role" r ON r."id" = ur."roleId" WHERE ur."userId" IN (${ph})`,
    args: ids,
  })
  const byUser = new Map<string, unknown[]>()
  for (const row of rr.rows as unknown as Record<string, unknown>[]) {
    const uid = String(row.userId)
    if (!byUser.has(uid)) byUser.set(uid, [])
    byUser.get(uid)!.push({
      userId: String(row.userId),
      roleId: String(row.roleId),
      createdAt: String(row.createdAt),
      role: mapRole({
        id: row.r_id,
        name: row.r_name,
        description: row.r_description,
        createdAt: row.r_createdAt,
        updatedAt: row.r_updatedAt,
      }),
    })
  }
  return users.map((u) => ({ ...u, roles: byUser.get(u.id) ?? [] }))
}

export async function listUsers(search: string) {
  const db = getDb()
  let sql = `SELECT * FROM "User"`
  const args: SqlArgs = []
  if (search) {
    sql += ` WHERE "name" LIKE ? OR "email" LIKE ?`
    const p = `%${search.replace(/%/g, '')}%`
    args.push(p, p)
  }
  sql += ` ORDER BY "createdAt" DESC`
  const r = await db.execute({ sql, args })
  const users = (r.rows as unknown as Record<string, unknown>[]).map(mapUserRow)
  return attachUserRoles(users)
}

export async function getUserById(id: string) {
  const db = getDb()
  const r = await db.execute({ sql: `SELECT * FROM "User" WHERE "id" = ?`, args: [id] })
  const row = r.rows[0] as unknown as Record<string, unknown> | undefined
  if (!row) return null
  const [u] = await attachUserRoles([mapUserRow(row)])
  return u
}

export async function findUserByEmail(email: string) {
  const db = getDb()
  const r = await db.execute({ sql: `SELECT * FROM "User" WHERE "email" = ?`, args: [email] })
  const row = r.rows[0] as unknown as Record<string, unknown> | undefined
  return row ? mapUserRow(row) : null
}

export async function createUser(input: {
  name: string
  email: string
  password?: string | null
  avatar?: string | null
  status?: boolean
  roleIds?: string[]
}) {
  const db = getDb()
  const id = newId()
  const t = nowIso()
  const st = input.status === false ? 0 : 1
  await db.execute({
    sql: `INSERT INTO "User" ("id","name","email","emailVerified","image","password","avatar","status","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?,?,?,?)`,
    args: [id, input.name, input.email, null, null, input.password ?? null, input.avatar ?? null, st, t, t],
  })
  if (input.roleIds?.length) {
    for (const rid of input.roleIds) {
      await db.execute({
        sql: `INSERT INTO "UserRole" ("userId","roleId","createdAt") VALUES (?,?,?)`,
        args: [id, rid, t],
      })
    }
  }
  return getUserById(id)
}

export async function updateUser(
  id: string,
  data: {
    name: string
    email: string
    password?: string | null
    avatar?: string | null
    status?: boolean
    roleIds?: string[]
  }
) {
  const db = getDb()
  const t = nowIso()
  const st = data.status === false ? 0 : 1
  let sql = `UPDATE "User" SET "name"=?, "email"=?, "avatar"=?, "status"=?, "updatedAt"=?`
  const args: SqlArgs = [data.name, data.email, data.avatar ?? null, st, t]
  if (data.password) {
    sql += `, "password"=?`
    args.push(data.password as SqlArg)
  }
  sql += ` WHERE "id"=?`
  args.push(id)
  await db.execute({ sql, args })
  await db.execute({ sql: `DELETE FROM "UserRole" WHERE "userId" = ?`, args: [id] })
  if (data.roleIds?.length) {
    for (const rid of data.roleIds) {
      await db.execute({
        sql: `INSERT INTO "UserRole" ("userId","roleId","createdAt") VALUES (?,?,?)`,
        args: [id, rid, t],
      })
    }
  }
  return getUserById(id)
}

export async function deleteUser(id: string) {
  const db = getDb()
  await db.execute({ sql: `DELETE FROM "User" WHERE "id" = ?`, args: [id] })
}

export async function listOAuthProviders() {
  const db = getDb()
  const r = await db.execute({ sql: `SELECT * FROM "OAuthProvider" ORDER BY "createdAt" DESC`, args: [] })
  return (r.rows as unknown as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    type: String(row.type),
    clientId: String(row.clientId),
    clientSecret: String(row.clientSecret),
    enabled: boolFromSql(row.enabled),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  }))
}

/** 登录配置用：仅启用，按 updatedAt 降序（与原先 Prisma orderBy 一致） */
export async function listEnabledOAuthProviders() {
  const db = getDb()
  const r = await db.execute({
    sql: `SELECT * FROM "OAuthProvider" WHERE "enabled" = 1 ORDER BY "updatedAt" DESC`,
    args: [],
  })
  return (r.rows as unknown as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    type: String(row.type),
    clientId: String(row.clientId),
    clientSecret: String(row.clientSecret),
    enabled: boolFromSql(row.enabled),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  }))
}

export async function getOAuthProviderById(id: string) {
  const db = getDb()
  const r = await db.execute({ sql: `SELECT * FROM "OAuthProvider" WHERE "id" = ?`, args: [id] })
  const row = r.rows[0] as unknown as Record<string, unknown> | undefined
  if (!row) return null
  return {
    id: String(row.id),
    name: String(row.name),
    type: String(row.type),
    clientId: String(row.clientId),
    clientSecret: String(row.clientSecret),
    enabled: boolFromSql(row.enabled),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  }
}

export async function createOAuthProvider(input: {
  name: string
  type: string
  clientId: string
  clientSecret: string
  enabled?: boolean
}) {
  const db = getDb()
  const id = newId()
  const t = nowIso()
  const en = input.enabled ? 1 : 0
  await db.execute({
    sql: `INSERT INTO "OAuthProvider" ("id","name","type","clientId","clientSecret","enabled","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?,?)`,
    args: [id, input.name, input.type, input.clientId, input.clientSecret, en, t, t],
  })
  return getOAuthProviderById(id)
}

export async function updateOAuthProvider(
  id: string,
  data: { name: string; type: string; clientId: string; clientSecret: string; enabled: boolean }
) {
  const db = getDb()
  const t = nowIso()
  const en = data.enabled ? 1 : 0
  await db.execute({
    sql: `UPDATE "OAuthProvider" SET "name"=?, "type"=?, "clientId"=?, "clientSecret"=?, "enabled"=?, "updatedAt"=? WHERE "id"=?`,
    args: [data.name, data.type, data.clientId, data.clientSecret, en, t, id],
  })
  return getOAuthProviderById(id)
}

export async function deleteOAuthProvider(id: string) {
  const db = getDb()
  await db.execute({ sql: `DELETE FROM "OAuthProvider" WHERE "id" = ?`, args: [id] })
}

export async function listSystemConfigs() {
  const db = getDb()
  const r = await db.execute({
    sql: `SELECT * FROM "SystemConfig" ORDER BY "group" ASC, "key" ASC`,
    args: [],
  })
  return (r.rows as unknown as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    key: String(row.key),
    value: String(row.value),
    group: String(row.group),
    label: row.label == null ? null : String(row.label),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  }))
}

export async function upsertSystemConfigRow(input: {
  key: string
  value: string
  group: string
  label: string
}) {
  const db = getDb()
  const t = nowIso()
  const existing = await db.execute({ sql: `SELECT "id" FROM "SystemConfig" WHERE "key" = ?`, args: [input.key] })
  const eid = existing.rows[0] as unknown as { id: string } | undefined
  if (eid) {
    await db.execute({
      sql: `UPDATE "SystemConfig" SET "value"=?, "group"=?, "label"=?, "updatedAt"=? WHERE "key"=?`,
      args: [input.value, input.group, input.label, t, input.key],
    })
    const r = await db.execute({ sql: `SELECT * FROM "SystemConfig" WHERE "key" = ?`, args: [input.key] })
    const row = r.rows[0] as unknown as Record<string, unknown>
    return {
      id: String(row.id),
      key: String(row.key),
      value: String(row.value),
      group: String(row.group),
      label: row.label == null ? null : String(row.label),
      createdAt: String(row.createdAt),
      updatedAt: String(row.updatedAt),
    }
  }
  const id = newId()
  await db.execute({
    sql: `INSERT INTO "SystemConfig" ("id","key","value","group","label","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?)`,
    args: [id, input.key, input.value, input.group, input.label, t, t],
  })
  const r = await db.execute({ sql: `SELECT * FROM "SystemConfig" WHERE "key" = ?`, args: [input.key] })
  const row = r.rows[0] as unknown as Record<string, unknown>
  return {
    id: String(row.id),
    key: String(row.key),
    value: String(row.value),
    group: String(row.group),
    label: row.label == null ? null : String(row.label),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  }
}

export async function dashboardCounts() {
  const db = getDb()
  const [u, ro, pe, ap] = await Promise.all([
    db.execute({ sql: `SELECT COUNT(*) as c FROM "User"`, args: [] }),
    db.execute({ sql: `SELECT COUNT(*) as c FROM "Role"`, args: [] }),
    db.execute({ sql: `SELECT COUNT(*) as c FROM "Permission"`, args: [] }),
    db.execute({ sql: `SELECT COUNT(*) as c FROM "Application"`, args: [] }),
  ])
  return {
    userCount: Number((u.rows[0] as unknown as { c: number }).c),
    roleCount: Number((ro.rows[0] as unknown as { c: number }).c),
    permissionCount: Number((pe.rows[0] as unknown as { c: number }).c),
    appCount: Number((ap.rows[0] as unknown as { c: number }).c),
  }
}
