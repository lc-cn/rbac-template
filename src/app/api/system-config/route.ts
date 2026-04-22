import { NextRequest, NextResponse } from 'next/server'
import { listSystemConfigs, upsertSystemConfigRow } from '@/lib/data-access'

export async function GET() {
  try {
    const configs = await listSystemConfigs()
    return NextResponse.json(configs)
  } catch (error) {
    return NextResponse.json({ error: '获取系统配置失败' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { configs } = body
    const results = await Promise.all(
      configs.map(({ key, value, group, label }: { key: string; value: string; group: string; label: string }) =>
        upsertSystemConfigRow({ key, value, group, label })
      )
    )
    return NextResponse.json(results)
  } catch (error) {
    return NextResponse.json({ error: '更新系统配置失败' }, { status: 500 })
  }
}
