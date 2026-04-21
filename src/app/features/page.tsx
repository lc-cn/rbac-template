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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'

interface Application {
  id: string
  name: string
  code: string
}

interface Feature {
  id: string
  name: string
  code: string
  description?: string
  applicationId: string
  application: Application
  permissions: { id: string }[]
  createdAt: string
}

export default function FeaturesPage() {
  const [features, setFeatures] = useState<Feature[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editFeature, setEditFeature] = useState<Feature | null>(null)
  const [form, setForm] = useState({ name: '', code: '', description: '', applicationId: '' })
  const { toast } = useToast()

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [featRes, appsRes] = await Promise.all([
        fetch(`/api/features?search=${encodeURIComponent(search)}`),
        fetch('/api/applications'),
      ])
      setFeatures(await featRes.json())
      setApplications(await appsRes.json())
    } catch {
      toast({ title: '错误', description: '加载数据失败', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [search, toast])

  useEffect(() => { fetchAll() }, [fetchAll])

  const openCreate = () => {
    setEditFeature(null)
    setForm({ name: '', code: '', description: '', applicationId: '' })
    setDialogOpen(true)
  }

  const openEdit = (feature: Feature) => {
    setEditFeature(feature)
    setForm({ name: feature.name, code: feature.code, description: feature.description || '', applicationId: feature.applicationId })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const url = editFeature ? `/api/features/${editFeature.id}` : '/api/features'
      const res = await fetch(url, {
        method: editFeature ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: '成功', description: editFeature ? '功能已更新' : '功能已创建' })
      setDialogOpen(false)
      fetchAll()
    } catch (error: any) {
      toast({ title: '错误', description: error.message, variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await fetch(`/api/features/${deleteId}`, { method: 'DELETE' })
      toast({ title: '成功', description: '功能已删除' })
      fetchAll()
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
          <h1 className="text-2xl font-bold text-gray-900">功能管理</h1>
          <p className="text-gray-500 mt-1">管理应用的功能模块</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />新建功能</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="搜索功能..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Button variant="outline" onClick={fetchAll}>搜索</Button>
          </div>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-gray-600">功能名</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">编码</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">所属应用</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">描述</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">权限数</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">创建时间</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">加载中...</td></tr>
              ) : features.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">暂无数据</td></tr>
              ) : features.map(f => (
                <tr key={f.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{f.name}</td>
                  <td className="py-3 px-4 font-mono text-xs text-gray-600">{f.code}</td>
                  <td className="py-3 px-4"><Badge variant="outline">{f.application?.name || '-'}</Badge></td>
                  <td className="py-3 px-4 text-gray-600">{f.description || '-'}</td>
                  <td className="py-3 px-4"><Badge variant="secondary">{f.permissions.length}</Badge></td>
                  <td className="py-3 px-4 text-gray-500">{new Date(f.createdAt).toLocaleDateString('zh-CN')}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(f)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(f.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
          <DialogHeader><DialogTitle>{editFeature ? '编辑功能' : '新建功能'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>所属应用</Label>
              <Select value={form.applicationId} onValueChange={v => setForm(p => ({ ...p, applicationId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="选择应用" />
                </SelectTrigger>
                <SelectContent>
                  {applications.map(app => (
                    <SelectItem key={app.id} value={app.id}>{app.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>功能名</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <Label>功能编码</Label>
              <Input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="例: user-management" />
            </div>
            <div>
              <Label>描述</Label>
              <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} />
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
            <AlertDialogDescription>确定要删除该功能吗？相关权限也会被删除。</AlertDialogDescription>
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
