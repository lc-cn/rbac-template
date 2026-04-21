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

interface Application {
  id: string
  name: string
  code: string
  description?: string
  status: boolean
  createdAt: string
  features: { id: string; name: string }[]
}

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editApp, setEditApp] = useState<Application | null>(null)
  const [form, setForm] = useState({ name: '', code: '', description: '', status: true })
  const { toast } = useToast()

  const fetchApps = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/applications?search=${encodeURIComponent(search)}`)
      setApps(await res.json())
    } catch {
      toast({ title: '错误', description: '获取应用列表失败', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [search, toast])

  useEffect(() => { fetchApps() }, [fetchApps])

  const openCreate = () => {
    setEditApp(null)
    setForm({ name: '', code: '', description: '', status: true })
    setDialogOpen(true)
  }

  const openEdit = (app: Application) => {
    setEditApp(app)
    setForm({ name: app.name, code: app.code, description: app.description || '', status: app.status })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const url = editApp ? `/api/applications/${editApp.id}` : '/api/applications'
      const res = await fetch(url, {
        method: editApp ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: '成功', description: editApp ? '应用已更新' : '应用已创建' })
      setDialogOpen(false)
      fetchApps()
    } catch (error: any) {
      toast({ title: '错误', description: error.message, variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await fetch(`/api/applications/${deleteId}`, { method: 'DELETE' })
      toast({ title: '成功', description: '应用已删除' })
      fetchApps()
    } catch {
      toast({ title: '错误', description: '删除失败', variant: 'destructive' })
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">应用管理</h1>
          <p className="text-gray-500 mt-1">管理接入系统的应用程序</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />新建应用</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="搜索应用..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Button variant="outline" onClick={fetchApps}>搜索</Button>
          </div>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-gray-600">应用名</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">编码</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">描述</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">功能数</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">状态</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">创建时间</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">加载中...</td></tr>
              ) : apps.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">暂无数据</td></tr>
              ) : apps.map(app => (
                <tr key={app.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{app.name}</td>
                  <td className="py-3 px-4 font-mono text-xs text-gray-600">{app.code}</td>
                  <td className="py-3 px-4 text-gray-600">{app.description || '-'}</td>
                  <td className="py-3 px-4"><Badge variant="outline">{app.features.length}</Badge></td>
                  <td className="py-3 px-4">
                    <Badge variant={app.status ? 'default' : 'secondary'}>{app.status ? '启用' : '禁用'}</Badge>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{new Date(app.createdAt).toLocaleDateString('zh-CN')}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(app)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(app.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
          <DialogHeader><DialogTitle>{editApp ? '编辑应用' : '新建应用'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>应用名</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <Label>应用编码</Label>
              <Input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="例: admin-system" />
            </div>
            <div>
              <Label>描述</Label>
              <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="appStatus" checked={form.status} onCheckedChange={v => setForm(p => ({ ...p, status: !!v }))} />
              <Label htmlFor="appStatus">启用</Label>
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
            <AlertDialogDescription>确定要删除该应用吗？删除后相关功能和权限也会被删除。</AlertDialogDescription>
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
