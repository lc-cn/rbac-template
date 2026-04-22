import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GithubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import { findUserByEmail, listEnabledOAuthProviders } from '@/lib/data-access'
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

/**
 * 从系统配置里的 OAuthProvider 表组装 NextAuth providers（与「系统配置 → OAuth2」联动）。
 * 登录页当前接入：GitHub、Google（其它 type 需单独接入对应 Provider）。
 */
export async function buildAuthOptions(): Promise<NextAuthOptions> {
  const oauthRows = await listEnabledOAuthProviders()

  const providers: NextAuthOptions['providers'] = [
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim()
        const password = credentials?.password
        if (!email || !password) return null

        const user = await findUserByEmail(email)
        if (!user?.password || user.password !== password) return null
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
        GithubProvider({
          clientId: cid,
          clientSecret: sec,
          allowDangerousEmailAccountLinking: true,
        })
      )
      githubAdded = true
    } else if (row.type === 'google' && !googleAdded) {
      providers.push(
        GoogleProvider({
          clientId: cid,
          clientSecret: sec,
          allowDangerousEmailAccountLinking: true,
        })
      )
      googleAdded = true
    }
  }

  return {
    adapter: LibsqlAdapter(),
    session: {
      strategy: 'jwt',
      maxAge: 60 * 60 * 24 * 7,
    },
    pages: {
      signIn: '/login',
    },
    providers,
    secret: getAuthSecret(),
    callbacks: {
      /** 允许登出后跳转到已登记的第三方 post_logout_redirect_uri（开发机 localhost 等） */
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
      async jwt({ token, user }) {
        if (user?.id) {
          token.sub = user.id
          token.id = user.id
        }
        return token
      },
      async session({ session, token }) {
        if (session.user && token.sub) {
          session.user.id = token.sub
        }
        return session
      },
    },
  }
}
