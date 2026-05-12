'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export type PlatformTenantOverviewRow = {
  id: string
  name: string
  slug: string
  createdAt: string
  updatedAt: string
  suspendedAt: string | null
  archivedAt: string | null
  applicationCount: number
  memberCount: number
}

type ConfirmOp = 'suspend' | 'unsuspend' | 'archive'

type PendingConfirm = {
  tenantId: string
  tenantName: string
  op: ConfirmOp
}

const dialogCopy: Record<
  ConfirmOp,
  { title: string; description: string; confirm: string; destructive?: boolean }
> = {
  suspend: {
    title: '确认暂停租户',
    description:
      '暂停后，该租户下的变更类 API 与部分流程可能受限；成员仍可登录查看（视策略而定）。确认后要解除暂停，可再次操作「解除暂停」。',
    confirm: '确认暂停',
    destructive: true,
  },
  unsuspend: {
    title: '确认解除暂停',
    description: '解除暂停后，租户将恢复为可正常进行业务写入（在未被归档的前提下）。',
    confirm: '解除暂停',
  },
  archive: {
    title: '确认归档租户',
    description:
      '归档后租户进入只读/受限策略，且当前平台不提供「解除归档」。请仅在运维确认后执行。',
    confirm: '确认归档',
    destructive: true,
  },
}

export function PlatformTenantsTable({ rows }: { rows: PlatformTenantOverviewRow[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [pending, setPending] = useState<PendingConfirm | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function applyLifecycle(tenantId: string, body: { suspended?: boolean; archived?: boolean }) {
    const res = await fetch(`/api/platform/tenants/${tenantId}/lifecycle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean }
    if (!res.ok) {
      throw new Error(data.error ?? `请求失败 (${res.status})`)
    }
  }

  async function onConfirm() {
    if (!pending) return
    const { tenantId, op } = pending
    const body =
      op === 'suspend'
        ? { suspended: true }
        : op === 'unsuspend'
          ? { suspended: false }
          : { archived: true }
    setSubmitting(true)
    try {
      await applyLifecycle(tenantId, body)
      toast({ title: '已更新', description: '租户生命周期已保存。' })
      setPending(null)
      router.refresh()
    } catch (e) {
      toast({
        title: '操作失败',
        description: e instanceof Error ? e.message : '未知错误',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const copy = pending ? dialogCopy[pending.op] : null

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-border/60">
        <table className="w-full text-sm">
          <thead className="border-b border-border/60 bg-muted/40">
            <tr>
              <th className="px-4 py-3 text-left font-medium">名称</th>
              <th className="px-4 py-3 text-left font-medium">slug</th>
              <th className="px-4 py-3 text-left font-medium">状态</th>
              <th className="px-4 py-3 text-right font-medium">成员</th>
              <th className="px-4 py-3 text-right font-medium">应用</th>
              <th className="px-4 py-3 text-left font-medium">创建时间</th>
              <th className="px-4 py-3 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const suspended = r.suspendedAt != null
              const archived = r.archivedAt != null
              return (
                <tr key={r.id} className="border-b border-border/40 last:border-0">
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.slug}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {archived ? (
                        <Badge variant="secondary">已归档</Badge>
                      ) : suspended ? (
                        <Badge variant="outline">已暂停</Badge>
                      ) : (
                        <Badge variant="outline" className="border-emerald-600/40 text-emerald-700 dark:text-emerald-400">
                          正常
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.memberCount}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.applicationCount}</td>
                  <td className="text-muted-foreground px-4 py-3 text-xs">{r.createdAt}</td>
                  <td className="px-4 py-3 text-right">
                    {!archived ? (
                      <div className="flex flex-wrap justify-end gap-2">
                        {suspended ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() =>
                              setPending({ tenantId: r.id, tenantName: r.name, op: 'unsuspend' })
                            }
                          >
                            解除暂停
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() => setPending({ tenantId: r.id, tenantName: r.name, op: 'suspend' })}
                          >
                            暂停
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="h-8"
                          onClick={() => setPending({ tenantId: r.id, tenantName: r.name, op: 'archive' })}
                        >
                          归档
                        </Button>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <AlertDialog open={!!pending} onOpenChange={(open) => !open && !submitting && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy?.description}
              {pending ? (
                <>
                  {' '}
                  目标租户：<span className="font-medium text-foreground">{pending.tenantName}</span>。
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>取消</AlertDialogCancel>
            <AlertDialogAction
              disabled={submitting}
              onClick={(ev) => {
                ev.preventDefault()
                void onConfirm()
              }}
              className={copy?.destructive ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {submitting ? '提交中…' : copy?.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
