'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { useI18n } from '@/i18n/context'
import { PageShell, PageHeader, CardToolbar } from '@/components/layout/page-shell'
import { Plus, Pencil, Trash2, Search, Users } from 'lucide-react'

interface Role {
  id: string
  name: string
  description?: string
}

interface User {
  id: string
  name: string
  email: string
  status: boolean
  createdAt: string
  roles: { role: Role }[]
}

interface UserFormData {
  name: string
  email: string
  password: string
  status: boolean
  roleIds: string[]
}

export default function UsersPage() {
  const { t, locale } = useI18n()
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [form, setForm] = useState<UserFormData>({
    name: '', email: '', password: '', status: true, roleIds: [],
  })
  const { toast } = useToast()
  const dateLocale = locale === 'zh' ? 'zh-CN' : 'en-US'

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/users?search=${encodeURIComponent(search)}`)
      const data = await res.json()
      setUsers(data)
    } catch {
      toast({ title: t('common.error'), description: t('users.fetchFail'), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [search, toast, t])

  const fetchRoles = useCallback(async () => {
    const res = await fetch('/api/roles')
    const data = await res.json()
    setRoles(data)
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])
  useEffect(() => { fetchRoles() }, [fetchRoles])

  const openCreate = () => {
    setEditUser(null)
    setForm({ name: '', email: '', password: '', status: true, roleIds: [] })
    setDialogOpen(true)
  }

  const openEdit = (user: User) => {
    setEditUser(user)
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      status: user.status,
      roleIds: user.roles.map(r => r.role.id),
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const url = editUser ? `/api/users/${editUser.id}` : '/api/users'
      const method = editUser ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      toast({
        title: t('common.success'),
        description: editUser ? t('users.updated') : t('users.created'),
      })
      setDialogOpen(false)
      fetchUsers()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      toast({ title: t('common.error'), description: message, variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/users/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(t('users.deleteFail'))
      toast({ title: t('common.success'), description: t('users.deleted') })
      fetchUsers()
    } catch {
      toast({ title: t('common.error'), description: t('users.deleteFail'), variant: 'destructive' })
    } finally {
      setDeleteId(null)
    }
  }

  const toggleRole = (roleId: string) => {
    setForm(prev => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter(id => id !== roleId)
        : [...prev.roleIds, roleId],
    }))
  }

  return (
    <PageShell mainVariant="wide">
      <PageHeader
        title={t('users.title')}
        description={t('users.subtitle')}
        actions={
          <Button className="w-full shrink-0 sm:w-auto" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> {t('users.create')}
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardToolbar>
            <div className="relative min-w-0 max-w-full flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('users.searchPlaceholder')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" onClick={fetchUsers}>{t('common.search')}</Button>
          </CardToolbar>
        </CardHeader>
        <CardContent>
          <div className="app-data-table app-data-table--comfortable overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="app-table-head">{t('users.colName')}</th>
                  <th className="app-table-head">{t('users.colEmail')}</th>
                  <th className="app-table-head">{t('users.colRoles')}</th>
                  <th className="app-table-head">{t('users.colStatus')}</th>
                  <th className="app-table-head">{t('common.createdAt')}</th>
                  <th className="app-table-head app-table-head-end">{t('common.operation')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">{t('common.loading')}</td></tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-0">
                      <div className="flex flex-col items-center justify-center gap-4 px-6 py-14 text-center sm:py-16">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <Users className="h-5 w-5" aria-hidden />
                        </div>
                        <div className="max-w-sm space-y-2">
                          <p className="text-base font-semibold text-foreground">{t('users.emptyTitle')}</p>
                          <p className="text-sm leading-relaxed text-muted-foreground">{t('users.emptyDesc')}</p>
                        </div>
                        <Button type="button" onClick={openCreate} className="gap-2">
                          <Plus className="h-4 w-4" />
                          {t('users.emptyCta')}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : users.map(user => (
                  <tr key={user.id} className="border-b border-border hover:bg-muted/50">
                    <td className="app-table-cell font-medium">{user.name}</td>
                    <td className="app-table-cell text-muted-foreground">{user.email}</td>
                    <td className="app-table-cell">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map(r => (
                          <Badge key={r.role.id} variant="secondary">{r.role.name}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="app-table-cell">
                      <Badge variant={user.status ? 'default' : 'secondary'}>
                        {user.status ? t('common.enabled') : t('common.disabled')}
                      </Badge>
                    </td>
                    <td className="app-table-cell text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString(dateLocale)}
                    </td>
                    <td className="app-table-cell app-table-cell-end">
                      <div className="app-row-actions">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(user)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteId(user.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editUser ? t('users.editTitle') : t('users.createTitle')}</DialogTitle>
          </DialogHeader>
          <div className="app-dialog-body">
            <div className="app-form-field">
              <Label htmlFor="name">{t('users.colName')}</Label>
              <Input id="name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="app-form-field">
              <Label htmlFor="email">{t('users.colEmail')}</Label>
              <Input id="email" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="app-form-field">
              <Label htmlFor="password">{editUser ? t('common.optionalPassword') : t('common.password')}</Label>
              <Input id="password" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2 pt-0.5">
              <Checkbox
                id="status"
                checked={form.status}
                onCheckedChange={checked => setForm(p => ({ ...p, status: !!checked }))}
              />
              <Label htmlFor="status" className="inline cursor-pointer">{t('common.enabled')}</Label>
            </div>
            <div className="app-form-field">
              <Label>{t('users.assignRoles')}</Label>
              <div className="app-picker-grid">
                {roles.map(role => (
                  <div key={role.id} className="app-picker-item">
                    <Checkbox
                      id={`role-${role.id}`}
                      checked={form.roleIds.includes(role.id)}
                      onCheckedChange={() => toggleRole(role.id)}
                    />
                    <Label
                      htmlFor={`role-${role.id}`}
                      className="inline min-w-0 flex-1 cursor-pointer font-normal leading-snug text-foreground"
                    >
                      {role.name}
                    </Label>
                  </div>
                ))}
                {roles.length === 0 && (
                  <p className="col-span-full py-6 text-center text-sm text-muted-foreground">{t('users.noRoles')}</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSubmit}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('users.deleteConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  )
}
