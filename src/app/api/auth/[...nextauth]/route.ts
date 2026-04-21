import type { NextRequest } from 'next/server'
import NextAuth from 'next-auth'
import { buildAuthOptions } from '@/lib/auth'

export async function GET(req: NextRequest, ctx: { params: Promise<{ nextauth: string[] }> }) {
  return NextAuth(req, ctx, await buildAuthOptions())
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ nextauth: string[] }> }) {
  return NextAuth(req, ctx, await buildAuthOptions())
}
