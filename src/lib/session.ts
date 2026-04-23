import { auth } from '@/auth'

/** App Router / Route Handler 中获取当前会话（与 Auth.js / NextAuth v5 一致） */
export async function getServerAuthSession() {
  return auth()
}
