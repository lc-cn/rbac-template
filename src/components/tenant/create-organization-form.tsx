'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type TenantsApiResponse = {
  tenants?: { id: string; name: string; slug: string }[]
  allowSelfServiceCreate?: boolean
}

export function CreateOrganizationForm({
  className,
  onSuccessNavigateTo = '/',
}: {
  className?: string
  /** 创建并切换租户后的跳转路径 */
  onSuccessNavigateTo?: string
}) {
  const router = useRouter()
  const { update } = useSession()
  const [policyLoading, setPolicyLoading] = useState(true)
  const [allowCreate, setAllowCreate] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPolicy = useCallback(async () => {
    setPolicyLoading(true)
    setError(null)
    try {
      const r = await fetch('/api/tenants')
      const d = (await r.json()) as TenantsApiResponse
      setAllowCreate(d.allowSelfServiceCreate === true)
    } catch {
      setAllowCreate(false)
      setError('无法读取创建策略，请稍后重试')
    } finally {
      setPolicyLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPolicy()
  }, [loadPolicy])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const trimmed = name.trim()
    if (!trimmed) {
      setError('请填写组织名称')
      return
    }
    setSubmitting(true)
    try {
      const r = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmed,
          slug: slug.trim() || undefined,
        }),
      })
      const data = (await r.json()) as { error?: string; tenant?: { id: string } }
      if (!r.ok) {
        setError(data.error ?? '创建失败')
        return
      }
      if (!data.tenant?.id) {
        setError('创建失败：未返回租户信息')
        return
      }
      await update({ currentTenantId: data.tenant.id })
      router.push(onSuccessNavigateTo)
      router.refresh()
    } catch {
      setError('网络错误，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  if (policyLoading) {
    return (
      <div className={className}>
        <p className="text-muted-foreground text-sm">加载中…</p>
      </div>
    )
  }

  if (!allowCreate) {
    return (
      <div className={className}>
        <p className="text-muted-foreground text-sm leading-relaxed">
          当前部署未开放自助创建组织。请联系平台管理员为你开通租户，或请已在组织内的管理员邀请你加入。
        </p>
        <p className="text-muted-foreground mt-2 text-xs">
          运维可将环境变量 <code className="rounded bg-muted px-1 py-0.5 font-mono">ALLOW_SELF_SERVICE_TENANT_CREATE</code>{' '}
          设为开启（非 0/false/no/off）后，用户可自行创建组织。
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className={className}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="org-name">组织名称</Label>
          <Input
            id="org-name"
            name="name"
            autoComplete="organization"
            placeholder="例如：Acme 研发团队"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            disabled={submitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-slug">
            标识 slug <span className="text-muted-foreground font-normal">（可选，留空则自动生成）</span>
          </Label>
          <Input
            id="org-slug"
            name="slug"
            autoComplete="off"
            placeholder="仅小写字母、数字与连字符"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            maxLength={63}
            disabled={submitting}
            className="font-mono text-sm"
          />
        </div>
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
        <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
          {submitting ? '创建中…' : '创建组织并成为负责人'}
        </Button>
      </div>
    </form>
  )
}
