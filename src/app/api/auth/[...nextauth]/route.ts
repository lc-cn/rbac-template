import type { NextRequest } from 'next/server'
import { handlers } from '@/auth'
import { attachAuthUrlDebugHeaders } from '@/lib/auth-url-debug-headers'

export async function GET(req: NextRequest) {
  const res = await handlers.GET(req)
  return attachAuthUrlDebugHeaders(res)
}

export async function POST(req: NextRequest) {
  const res = await handlers.POST(req)
  return attachAuthUrlDebugHeaders(res)
}
