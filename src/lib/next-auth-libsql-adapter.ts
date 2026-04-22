import type { Adapter, AdapterAccount, AdapterSession, AdapterUser, VerificationToken } from 'next-auth/adapters'
import { getDb, newId, nowIso } from '@/lib/db'

function mapUserRow(row: Record<string, unknown>): AdapterUser {
  return {
    id: String(row.id),
    name: row.name == null ? null : String(row.name),
    email: String(row.email),
    emailVerified: row.emailVerified ? new Date(String(row.emailVerified)) : null,
    image: row.image == null ? null : String(row.image),
  }
}

export function LibsqlAdapter(): Adapter {
  const getUserById = async (id: string): Promise<AdapterUser | null> => {
    const db = getDb()
    const r = await db.execute({ sql: `SELECT * FROM "User" WHERE "id" = ?`, args: [id] })
    const row = r.rows[0] as unknown as Record<string, unknown> | undefined
    return row ? mapUserRow(row) : null
  }

  return {
    async createUser(data: Omit<AdapterUser, 'id'>) {
      const db = getDb()
      const id = newId()
      const t = nowIso()
      await db.execute({
        sql: `INSERT INTO "User" ("id","name","email","emailVerified","image","password","avatar","status","createdAt","updatedAt")
              VALUES (?,?,?,?,?,?,?,?,?,?)`,
        args: [
          id,
          data.name ?? '',
          data.email ?? '',
          data.emailVerified?.toISOString() ?? null,
          data.image ?? null,
          null,
          null,
          1,
          t,
          t,
        ],
      })
      const r = await db.execute({ sql: `SELECT * FROM "User" WHERE "id" = ?`, args: [id] })
      const row = r.rows[0] as unknown as Record<string, unknown>
      return mapUserRow(row)
    },

    getUser: getUserById,

    async getUserByEmail(email) {
      const db = getDb()
      const r = await db.execute({ sql: `SELECT * FROM "User" WHERE "email" = ?`, args: [email] })
      const row = r.rows[0] as unknown as Record<string, unknown> | undefined
      return row ? mapUserRow(row) : null
    },

    async getUserByAccount({ provider, providerAccountId }) {
      const db = getDb()
      const r = await db.execute({
        sql: `SELECT u.* FROM "User" u
              INNER JOIN "Account" a ON a."userId" = u."id"
              WHERE a."provider" = ? AND a."providerAccountId" = ? LIMIT 1`,
        args: [provider, providerAccountId],
      })
      const row = r.rows[0] as unknown as Record<string, unknown> | undefined
      return row ? mapUserRow(row) : null
    },

    async updateUser({ id, ...data }) {
      const db = getDb()
      const sets: string[] = []
      const args: (string | number | bigint | boolean | null)[] = []
      if (data.name !== undefined) {
        sets.push('"name" = ?')
        args.push(data.name)
      }
      if (data.email !== undefined) {
        sets.push('"email" = ?')
        args.push(data.email)
      }
      if (data.emailVerified !== undefined) {
        sets.push('"emailVerified" = ?')
        args.push(data.emailVerified ? data.emailVerified.toISOString() : null)
      }
      if (data.image !== undefined) {
        sets.push('"image" = ?')
        args.push(data.image)
      }
      sets.push('"updatedAt" = ?')
      args.push(nowIso())
      args.push(id)
      await db.execute({
        sql: `UPDATE "User" SET ${sets.join(', ')} WHERE "id" = ?`,
        args,
      })
      const u = await getUserById(id)
      if (!u) throw new Error('User not found after update')
      return u
    },

    async deleteUser(userId) {
      const db = getDb()
      await db.execute({ sql: `DELETE FROM "User" WHERE "id" = ?`, args: [userId] })
    },

    async linkAccount(data: AdapterAccount) {
      const db = getDb()
      const id = data.id && String(data.id).length > 0 ? String(data.id) : newId()
      await db.execute({
        sql: `INSERT INTO "Account" ("id","userId","type","provider","providerAccountId","refresh_token","access_token","expires_at","token_type","scope","id_token","session_state")
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        args: [
          id,
          data.userId,
          data.type,
          data.provider,
          data.providerAccountId,
          data.refresh_token ?? null,
          data.access_token ?? null,
          data.expires_at ?? null,
          data.token_type ?? null,
          data.scope ?? null,
          data.id_token ?? null,
          data.session_state ?? null,
        ],
      })
    },

    async unlinkAccount({ provider, providerAccountId }: Pick<AdapterAccount, 'provider' | 'providerAccountId'>) {
      const db = getDb()
      await db.execute({
        sql: `DELETE FROM "Account" WHERE "provider" = ? AND "providerAccountId" = ?`,
        args: [provider, providerAccountId],
      })
    },

    async createSession({ sessionToken, userId, expires }) {
      const db = getDb()
      const id = newId()
      await db.execute({
        sql: `INSERT INTO "Session" ("id","sessionToken","userId","expires") VALUES (?,?,?,?)`,
        args: [id, sessionToken, userId, expires.toISOString()],
      })
      return { sessionToken, userId, expires }
    },

    async getSessionAndUser(sessionToken) {
      const db = getDb()
      const r = await db.execute({
        sql: `SELECT s."sessionToken" as s_token, s."userId" as s_userId, s."expires" as s_expires,
                     u.*
              FROM "Session" s
              JOIN "User" u ON u."id" = s."userId"
              WHERE s."sessionToken" = ? LIMIT 1`,
        args: [sessionToken],
      })
      const row = r.rows[0] as unknown as Record<string, unknown> | undefined
      if (!row) return null
      const user: AdapterUser = mapUserRow({
        id: row.id,
        name: row.name,
        email: row.email,
        emailVerified: row.emailVerified,
        image: row.image,
      })
      const session: AdapterSession = {
        sessionToken: String(row.s_token),
        userId: String(row.s_userId),
        expires: new Date(String(row.s_expires)),
      }
      return { user, session }
    },

    async updateSession({ sessionToken, ...data }) {
      const db = getDb()
      if (data.expires !== undefined) {
        await db.execute({
          sql: `UPDATE "Session" SET "expires" = ? WHERE "sessionToken" = ?`,
          args: [data.expires.toISOString(), sessionToken],
        })
      }
      const r = await db.execute({
        sql: `SELECT * FROM "Session" WHERE "sessionToken" = ?`,
        args: [sessionToken],
      })
      const row = r.rows[0] as unknown as Record<string, unknown> | undefined
      if (!row) return null
      return {
        sessionToken: String(row.sessionToken),
        userId: String(row.userId),
        expires: new Date(String(row.expires)),
      }
    },

    async deleteSession(sessionToken) {
      const db = getDb()
      await db.execute({ sql: `DELETE FROM "Session" WHERE "sessionToken" = ?`, args: [sessionToken] })
    },

    async createVerificationToken(data: VerificationToken) {
      const db = getDb()
      await db.execute({
        sql: `INSERT INTO "VerificationToken" ("identifier","token","expires") VALUES (?,?,?)`,
        args: [data.identifier, data.token, data.expires.toISOString()],
      })
      return data
    },

    async useVerificationToken({ identifier, token }) {
      const db = getDb()
      const r = await db.execute({
        sql: `DELETE FROM "VerificationToken" WHERE "identifier" = ? AND "token" = ? RETURNING *`,
        args: [identifier, token],
      })
      const row = r.rows[0] as unknown as Record<string, unknown> | undefined
      if (!row) return null
      return {
        identifier: String(row.identifier),
        token: String(row.token),
        expires: new Date(String(row.expires)),
      }
    },
  }
}
