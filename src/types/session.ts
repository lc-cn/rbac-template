import type { Session } from 'next-auth'

/** 与 `next-auth` 的 Session 声明一致，便于在 Route Handler 中作类型收窄 */
export type AppSession = Session
