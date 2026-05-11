import NextAuth from 'next-auth'
import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import GitHub from 'next-auth/providers/github'
import Google from 'next-auth/providers/google'
import { findUserByEmail, getUserTenantMembership, listEnabledOAuthProviders, resolveJwtTenantClaims } from '@/lib/data-access'
import type { TenantRole } from '@/lib/data-access'
import { verifyStoredPassword } from '@/lib/password'
import { LibsqlAdapter } from '@/lib/next-auth-libsql-adapter'
import { getAuthSecret } from '@/lib/auth-secret'

function isPlaceholderOAuthSecret(clientId: string, clientSecret: string) {
  const id = clientId.trim().toLowerCase()
  const sec = clientSecret.trim().toLowerCase()
  return (
    !id ||
    !sec ||
    id.startsWith('your-') ||
    sec.startsWith('your-') ||
    id === 'placeholder' ||
    sec === 'placeholder'
  )
}

function genericOidcProvider(): NextAuthConfig['providers'][number] | null {
  const issuer = process.env.AUTH_OIDC_ISSUER?.trim().replace(/\/$/, '') ?? ''
  const clientId = process.env.AUTH_OIDC_ID?.trim() ?? ''
  const clientSecret = process.env.AUTH_OIDC_SECRET?.trim() ?? ''
  if (!issuer || !clientId || !clientSecret) return null
  return {
    id: 'oidc',
    name: process.env.AUTH_OIDC_NAME?.trim() || 'OIDC',
    type: 'oidc',
    issuer,
    clientId,
    clientSecret,
    allowDangerousEmailAccountLinking: true,
  }
}

async function buildProviders(): Promise<NextAuthConfig['providers']> {
  const oauthRows = await listEnabledOAuthProviders()
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

  let githubAdded = false
  let googleAdded = false

  for (const row of oauthRows) {
    const cid = row.clientId?.trim() ?? ''
    const sec = row.clientSecret?.trim() ?? ''
    if (isPlaceholderOAuthSecret(cid, sec)) continue

    if (row.type === 'github' && !githubAdded) {
      providers.push(
        GitHub({
          clientId: cid,
          clientSecret: sec,
          allowDangerousEmailAccountLinking: true,
        })
      )
      githubAdded = true
    } else if (row.type === 'google' && !googleAdded) {
      providers.push(
        Google({
          clientId: cid,
          clientSecret: sec,
          allowDangerousEmailAccountLinking: true,
        })
      )
      googleAdded = true
    }
  }

  const oidc = genericOidcProvider()
  if (oidc) providers.push(oidc)

  return providers
}

export const { handlers, auth, signIn, signOut } = NextAuth(async () => ({
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
  providers: await buildProviders(),
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
}))
