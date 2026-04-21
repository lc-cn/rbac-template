'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'

interface Permission {
  id: string
  name: string
  code: string
}

interface Role {
  id: string
  name: string
  description?: string
  createdAt: string
  users: { user: { id: string; name: string } }[]
  permissions: { permission: Permission }[]
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editRole, setEditRole] = useState<Role | null>(null)
  const [form, setForm] = useState({ name: '', description: '', permissionIds: [] as string[] })
  const { toast } = useToast()

  const fetchRoles = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/roles?search=${encodeURIComponent(search)}`)
      setRoles(await res.json())
    } catch {
      toast({ title: '错误', description: '获取角色列表失败', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [search, toast])

  const fetchPermissions = useCallback(async () => {
    const res = await fetch('/api/permissions')
    setPermissions(await res.json())
  }, [])

  useEffect(() => { fetchRoles() }, [fetchRoles])
  useEffect(() => { fetchPermissions() }, [fetchPermissions])

  const openCreate = () => {
    setEditRole(null)
    setForm({ name: '', description: '', permissionIds: [] })
    setDialogOpen(true)
  }

  const openEdit = (role: Role) => {
    setEditRole(role)
    setForm({
      name: role.name,
      description: role.description || '',
      permissionIds: role.permissions.map(p => p.permission.id),
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const url = editRole ? `/api/roles/${editRole.id}` : '/api/roles'
      const res = await fetch(url, {
        method: editRole ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: '成功', description: editRole ? '角色已更新' : '角色已创建' })
      setDialogOpen(false)
      fetchRoles()
    } catch (error: any) {
      toast({ title: '错误', description: error.message, variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await fetch(`/api/roles/${deleteId}`, { method: 'DELETE' })
      toast({ title: '成功', description: '角色已删除' })
      fetchRoles()
    } catch {
      toast({ title: '错误', description: '删除失败', variant: 'destructive' })
    } finally {
      setDeleteId(null)
    }
  }

  const togglePermission = (id: string) => {
    setForm(prev => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(id)
        ? prev.permissionIds.filter(p => p !== id)
        : [...prev.permissionIds, id],
    }))
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">角色管理</h1>
          <p className="text-gray-500 mt-1">管理系统角色及权限分配</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />新建角色</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="搜索角色..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Button variant="outline" onClick={fetchRoles}>搜索</Button>
          </div>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-gray-600">角色名</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">描述</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">用户数</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">权限数</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">创建时间</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">加载中...</td></tr>
              ) : roles.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">暂无数据</td></tr>
              ) : roles.map(role => (
                <tr key={role.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{role.name}</td>
                  <td className="py-3 px-4 text-gray-600">{role.description || '-'}</td>
                  <td className="py-3 px-4"><Badge variant="outline">{role.users.length}</Badge></td>
                  <td className="py-3 px-4"><Badge variant="outline">{role.permissions.length}</Badge></td>
                  <td className="py-3 px-4 text-gray-500">{new Date(role.createdAt).toLocaleDateString('zh-CN')}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(role)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(role.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editRole ? '编辑角色' : '新建角色'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>角色名</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <Label>描述</Label>
              <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} />
            </div>
            <div>
              <Label>分配权限</Label>
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                {permissions.map(perm => (
                  <div key={perm.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`perm-${perm.id}`}
                      checked={form.permissionIds.includes(perm.id)}
                      onCheckedChange={() => togglePermission(perm.id)}
                    />
                    <Label htmlFor={`perm-${perm.id}`} className="font-normal">
                      {perm.name} <span className="text-gray-400 text-xs">({perm.code})</span>
                    </Label>
                  </div>
                ))}
                {permissions.length === 0 && <p className="text-sm text-gray-400">暂无权限</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSubmit}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>确定要删除该角色吗？</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
