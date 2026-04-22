import { NextRequest, NextResponse } from 'next/server'
import { unlinkOAuthAccountForUser } from '@/lib/data-access'
import { getServerAuthSession } from '@/lib/session'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerAuthSession()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: '未登录' }, { status: 401 })

    const body = (await request.json()) as { provider?: unknown; providerAccountId?: unknown }
    const provider = typeof body.provider === 'string' ? body.provider : ''
    const providerAccountId = typeof body.providerAccountId === 'string' ? body.providerAccountId : ''
    if (!provider || !providerAccountId) {
      return NextResponse.json({ error: '缺少 provider 或 providerAccountId' }, { status: 400 })
    }

    const r = await unlinkOAuthAccountForUser(userId, provider, providerAccountId)
    if (!('ok' in r && r.ok)) {
      const err = 'error' in r ? r.error : 'not_linked'
      if (err === 'not_found') return NextResponse.json({ error: '用户不存在' }, { status: 404 })
      if (err === 'last_login_method') {
        return NextResponse.json({ error: '至少保留一种登录方式，无法解绑' }, { status: 400 })
      }
      return NextResponse.json({ error: '未找到该绑定' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '解绑失败' }, { status: 500 })
  }
}
