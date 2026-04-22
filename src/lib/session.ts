import { getServerSession } from 'next-auth'
import { buildAuthOptions } from '@/lib/auth'

/** App Router / Route Handler 中获取当前 NextAuth 会话（与 [...nextauth] 使用同一套 options） */
export async function getServerAuthSession() {
  return getServerSession(await buildAuthOptions())
}
