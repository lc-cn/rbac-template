'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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
import { useToast } from '@/hooks/use-toast'
import { useI18n } from '@/i18n/context'
import { PageShell, PageHeader, CardToolbar } from '@/components/layout/page-shell'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import type { OAuth2ClientDto } from './types'

export default function OAuth2ClientsPage() {
  const { t, locale } = useI18n()
  const [rows, setRows] = useState<OAuth2ClientDto[]>([])
  const [loading, setLoading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const { toast } = useToast()
  const dateLocale = locale === 'zh' ? 'zh-CN' : 'en-US'

  const fetchRows = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/oauth2-clients')
      const data = (await res.json()) as OAuth2ClientDto[]
      setRows(Array.isArray(data) ? data : [])
    } catch {
      toast({ title: t('common.error'), description: t('oauth2Clients.fetchFail'), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast, t])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/oauth2-clients')
        const data = await res.json()
        if (!cancelled) setRows(Array.isArray(data) ? data : [])
      } catch {
        if (!cancelled) {
          toast({ title: t('common.error'), description: t('oauth2Clients.fetchFail'), variant: 'destructive' })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [t, toast])

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/oauth2-clients/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(t('oauth2Clients.deleteFail'))
      toast({ title: t('common.success'), description: t('oauth2Clients.deleted') })
      void fetchRows()
    } catch {
      toast({ title: t('common.error'), description: t('oauth2Clients.deleteFail'), variant: 'destructive' })
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <PageShell>
      <PageHeader
        title={t('oauth2Clients.title')}
        description={t('oauth2Clients.subtitle')}
        actions={
          <Button asChild className="w-full shrink-0 sm:w-auto">
            <Link href="/oauth2-clients/new">
              <Plus className="mr-2 h-4 w-4" />
              {t('oauth2Clients.create')}
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardToolbar>
            <Button variant="outline" onClick={() => void fetchRows()}>
              {t('common.search')}
            </Button>
          </CardToolbar>
        </CardHeader>
        <CardContent>
          <div className="app-data-table overflow-x-auto">
            <table className="w-full min-w-[52rem] text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="app-table-head">{t('oauth2Clients.colName')}</th>
                  <th className="app-table-head">{t('oauth2Clients.colClientId')}</th>
                  <th className="app-table-head">{t('oauth2Clients.colType')}</th>
                  <th className="app-table-head">{t('oauth2Clients.colScopes')}</th>
                  <th className="app-table-head">{t('oauth2Clients.colToken')}</th>
                  <th className="app-table-head">{t('common.createdAt')}</th>
                  <th className="app-table-head app-table-head-end">{t('common.operation')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      {t('common.loading')}
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      {t('common.empty')}
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className="border-b border-border hover:bg-muted/50">
                      <td className="app-table-cell">
                        <div className="flex min-w-0 items-center gap-2.5">
                          {row.logoUrl ? (
                            <img
                              src={row.logoUrl}
                              alt=""
                              className="h-9 w-9 shrink-0 rounded-lg border border-border/60 bg-muted object-cover"
                            />
                          ) : (
                            <div className="h-9 w-9 shrink-0 rounded-lg bg-muted ring-1 ring-border/60" />
                          )}
                          <span className="min-w-0 truncate font-medium">{row.name}</span>
                        </div>
                      </td>
                      <td className="app-table-cell font-mono text-xs text-muted-foreground">{row.clientId}</td>
                      <td className="app-table-cell">
                        <Badge variant={row.isPublic ? 'secondary' : 'default'}>
                          {row.isPublic ? t('oauth2Clients.typePublic') : t('oauth2Clients.typeConfidential')}
                        </Badge>
                      </td>
                      <td className="app-table-cell max-w-[10rem]">
                        <div className="flex flex-wrap gap-1">
                          {(row.allowedScopes || '')
                            .split(/\s+/)
                            .filter(Boolean)
                            .map((s) => (
                              <Badge key={s} variant="outline" className="font-normal">
                                {s}
                              </Badge>
                            ))}
                        </div>
                      </td>
                      <td
                        className="app-table-cell whitespace-nowrap font-mono text-xs text-muted-foreground"
                        title="access / refresh / code"
                      >
                        {row.accessTokenTtlSeconds}s / {row.refreshTokenTtlDays}d / {row.authorizationCodeTtlMinutes}m
                      </td>
                      <td className="app-table-cell text-muted-foreground">
                        {new Date(row.createdAt).toLocaleDateString(dateLocale)}
                      </td>
                      <td className="app-table-cell app-table-cell-end">
                        <div className="app-row-actions">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/oauth2-clients/${row.id}/edit`} aria-label={t('oauth2Clients.editTitle')}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteId(row.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('oauth2Clients.deleteConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDelete()} className="bg-red-600 hover:bg-red-700">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  )
}
