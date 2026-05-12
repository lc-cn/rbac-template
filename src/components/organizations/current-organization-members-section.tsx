'use client'

import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useI18n } from '@/i18n/context'
import {
  ORGANIZATIONS_CURRENT_MEMBERS_PAGE_SIZE,
  ORGANIZATIONS_CURRENT_MEMBERS_SEARCH_DEBOUNCE_MS,
} from '@/lib/organizations-current-members-params'
import type { TenantRole } from '@/lib/data-access'
import { Users } from 'lucide-react'

type MemberRow = {
  userId: string
  displayName: string
  email: string
  tenantRole: TenantRole
}

type MembersPayload = {
  items: MemberRow[]
  total: number
  page: number
  pageSize: number
}

type Props = {
  currentUserId: string
}

function roleLabelKey(role: TenantRole): string {
  if (role === 'owner') return 'organizationsCurrent.members.roleOwner'
  if (role === 'admin') return 'organizationsCurrent.members.roleAdmin'
  return 'organizationsCurrent.members.roleMember'
}

export function CurrentOrganizationMembersSection({ currentUserId }: Props) {
  const { t } = useI18n()
  const { toast } = useToast()
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<MembersPayload | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const tmr = setTimeout(() => {
      const next = searchInput.trim()
      setDebouncedSearch((prev) => {
        if (prev !== next) {
          setPage(1)
        }
        return next
      })
    }, ORGANIZATIONS_CURRENT_MEMBERS_SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(tmr)
  }, [searchInput])

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      try {
        const sp = new URLSearchParams()
        sp.set('page', String(page))
        if (debouncedSearch) sp.set('q', debouncedSearch)
        const res = await fetch(`/api/organizations/current/members?${sp.toString()}`)
        if (!res.ok) {
          throw new Error('bad_status')
        }
        const json = (await res.json()) as MembersPayload
        if (!cancelled) setData(json)
      } catch {
        if (!cancelled) {
          toast({
            title: t('common.error'),
            description: t('organizationsCurrent.members.loadError'),
            variant: 'destructive',
          })
          setData(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [page, debouncedSearch, toast, t])

  const totalPages = useMemo(() => {
    if (!data?.total) return 1
    return Math.max(1, Math.ceil(data.total / ORGANIZATIONS_CURRENT_MEMBERS_PAGE_SIZE))
  }, [data?.total])

  const emptyWithSearch = debouncedSearch.length > 0 && data && data.items.length === 0 && !loading

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="size-5 shrink-0" aria-hidden />
          <CardTitle className="text-lg">{t('organizationsCurrent.members.title')}</CardTitle>
        </div>
        <CardDescription>{t('organizationsCurrent.members.subtitle')}</CardDescription>
        <div className="pt-2">
          <Input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('organizationsCurrent.members.searchPlaceholder')}
            aria-label={t('organizationsCurrent.members.searchPlaceholder')}
            className="max-w-md"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto rounded-md border border-border/60">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead className="border-b border-border/60 bg-muted/40">
              <tr>
                <th className="px-3 py-2 font-medium">{t('organizationsCurrent.members.colDisplayName')}</th>
                <th className="px-3 py-2 font-medium">{t('organizationsCurrent.members.colEmail')}</th>
                <th className="px-3 py-2 font-medium">{t('organizationsCurrent.members.colRole')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">
                    {t('common.loading')}
                  </td>
                </tr>
              )}
              {!loading && data?.items.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">
                    <p className="font-medium text-foreground">
                      {emptyWithSearch
                        ? t('organizationsCurrent.members.emptyTitle')
                        : t('organizationsCurrent.members.emptyNoSearch')}
                    </p>
                    {emptyWithSearch ? (
                      <p className="mt-1 text-xs">{t('organizationsCurrent.members.emptyDesc')}</p>
                    ) : null}
                  </td>
                </tr>
              )}
              {!loading &&
                data?.items.map((row) => (
                  <tr
                    key={row.userId}
                    className={row.userId === currentUserId ? 'bg-muted/30' : undefined}
                  >
                    <td className="px-3 py-2 align-middle">
                      <span className="font-medium text-foreground">{row.displayName}</span>
                      {row.userId === currentUserId ? (
                        <Badge variant="secondary" className="ml-2 align-middle text-xs">
                          {t('organizationsCurrent.members.youBadge')}
                        </Badge>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 align-middle text-muted-foreground">{row.email}</td>
                    <td className="px-3 py-2 align-middle">
                      <span className="text-foreground">{t(roleLabelKey(row.tenantRole))}</span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {data && data.total > 0 ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {t('organizationsCurrent.members.pageInfo', {
                page: String(data.page),
                totalPages: String(totalPages),
                total: String(data.total),
              })}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {t('organizationsCurrent.members.prevPage')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                {t('organizationsCurrent.members.nextPage')}
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
