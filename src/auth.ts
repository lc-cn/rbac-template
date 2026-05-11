import NextAuth from 'next-auth'
import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { findUserByEmail, getUserTenantMembership, resolveJwtTenantClaims } from '@/lib/data-access'
import type { TenantRole } from '@/lib/data-access'
import { verifyStoredPassword } from '@/lib/password'
import { LibsqlAdapter } from '@/lib/next-auth-libsql-adapter'
import { getAuthSecret } from '@/lib/auth-secret'

const providers: NextAuthConfig['providers'] = [
  Credentials({
    id: 'credentials',
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      const email = typeof credentials?.email === 'string' ? credentials.email.trim() : ''
      const password = typeof credentials?.password === 'string' ? credentials.password : ''
      if (!email || !password) return null

      const user = await findUserByEmail(email)
      if (!user?.password || !verifyStoredPassword(user.password, password)) return null
      if (!user.status) return null

      const profileImage = user.image ?? user.avatar ?? undefined

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: profileImage,
      }
    },
  }),
]

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: LibsqlAdapter(),
  trustHost: true,
  secret: getAuthSecret(),
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 7,
  },
  pages: {
    signIn: '/login',
  },
  providers,
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`
      if (url.startsWith(baseUrl)) return url
      try {
        const u = new URL(url)
        const b = new URL(baseUrl)
        if (u.origin === b.origin) return url
        if (u.protocol === 'http:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1')) return url
      } catch {
        /* ignore */
      }
      return baseUrl
    },
    async jwt({ token, user, trigger, session }) {
      if (user?.id) {
        token.sub = user.id
        token.id = user.id
        token.name = user.name ?? undefined
        token.email = user.email ?? undefined
        token.picture = user.image ?? undefined
        const claims = await resolveJwtTenantClaims(user.id)
        token.currentTenantId = claims.currentTenantId
        token.isPlatformAdmin = claims.isPlatformAdmin
        token.tenantRole = claims.tenantRole
      }
      if (trigger === 'update' && session && typeof session === 'object') {
        const s = session as {
          name?: string | null
          email?: string | null
          image?: string | null
          currentTenantId?: string | null
        }
        if ('name' in s) token.name = s.name ?? undefined
        if ('email' in s) token.email = s.email ?? undefined
        if ('image' in s) token.picture = s.image ?? undefined
        if ('currentTenantId' in s && token.sub) {
          const raw = s.currentTenantId
          if (raw === null || raw === undefined || raw === '') {
            token.currentTenantId = null
            token.tenantRole = null
          } else {
            const m = await getUserTenantMembership(token.sub, String(raw))
            if (m) {
              token.currentTenantId = String(raw)
              token.tenantRole = m.tenantRole
            }
          }
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
        if (token.name != null) session.user.name = token.name as string
        if (token.email != null) session.user.email = token.email as string
        if (token.picture != null) session.user.image = token.picture as string
      }
      session.currentTenantId = typeof token.currentTenantId === 'string' ? token.currentTenantId : null
      session.isPlatformAdmin = !!token.isPlatformAdmin
      const tr = token.tenantRole
      session.tenantRole =
        tr === 'owner' || tr === 'admin' || tr === 'member' ? (tr as TenantRole) : null
      return session
    },
  },
})
