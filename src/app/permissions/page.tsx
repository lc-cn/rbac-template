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
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion'
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
  applicationId: string
  application: Application
}

interface Permission {
  id: string
  name: string
  code: string
  description?: string
  featureId: string
  feature: Feature
  createdAt: string
}

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [features, setFeatures] = useState<Feature[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editPerm, setEditPerm] = useState<Permission | null>(null)
  const [form, setForm] = useState({ name: '', code: '', description: '', featureId: '' })
  const { toast } = useToast()

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [permsRes, featuresRes, appsRes] = await Promise.all([
        fetch(`/api/permissions?search=${encodeURIComponent(search)}`),
        fetch('/api/features'),
        fetch('/api/applications'),
      ])
      setPermissions(await permsRes.json())
      setFeatures(await featuresRes.json())
      setApplications(await appsRes.json())
    } catch {
      toast({ title: '错误', description: '加载数据失败', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [search, toast])

  useEffect(() => { fetchAll() }, [fetchAll])

  const grouped = applications.map(app => ({
    app,
    features: features
      .filter(f => f.applicationId === app.id)
      .map(f => ({
        feature: f,
        permissions: permissions.filter(p => p.featureId === f.id),
      })),
    total: permissions.filter(p => p.feature?.application?.id === app.id).length,
  }))

  const openCreate = () => {
    setEditPerm(null)
    setForm({ name: '', code: '', description: '', featureId: '' })
    setDialogOpen(true)
  }

  const openEdit = (perm: Permission) => {
    setEditPerm(perm)
    setForm({ name: perm.name, code: perm.code, description: perm.description || '', featureId: perm.featureId })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const url = editPerm ? `/api/permissions/${editPerm.id}` : '/api/permissions'
      const res = await fetch(url, {
        method: editPerm ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: '成功', description: editPerm ? '权限已更新' : '权限已创建' })
      setDialogOpen(false)
      fetchAll()
    } catch (error: any) {
      toast({ title: '错误', description: error.message, variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await fetch(`/api/permissions/${deleteId}`, { method: 'DELETE' })
      toast({ title: '成功', description: '权限已删除' })
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
          <h1 className="text-2xl font-bold text-gray-900">权限管理</h1>
          <p className="text-gray-500 mt-1">按应用分组展示系统权限</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />新建权限</Button>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="搜索权限..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Button variant="outline" onClick={fetchAll}>搜索</Button>
          </div>
        </CardHeader>
      </Card>

      {loading ? (
        <div className="text-center py-8 text-gray-400">加载中...</div>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {grouped.map(({ app, features: featureGroups, total }) => (
            <AccordionItem key={app.id} value={app.id} className="border rounded-lg bg-white shadow-sm">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-900">{app.name}</span>
                  <Badge variant="outline" className="text-xs">{app.code}</Badge>
                  <Badge className="text-xs">{total} 个权限</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4">
                {featureGroups.length === 0 ? (
                  <p className="text-sm text-gray-400 py-2">该应用暂无功能模块</p>
                ) : featureGroups.map(({ feature, permissions: perms }) => (
                  <div key={feature.id} className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-700">{feature.name}</span>
                      <Badge variant="secondary" className="text-xs">{feature.code}</Badge>
                    </div>
                    {perms.length === 0 ? (
                      <p className="text-xs text-gray-400 pl-4">暂无权限</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="text-left py-2 px-3 font-medium text-gray-600">权限名</th>
                            <th className="text-left py-2 px-3 font-medium text-gray-600">编码</th>
                            <th className="text-left py-2 px-3 font-medium text-gray-600">描述</th>
                            <th className="text-right py-2 px-3 font-medium text-gray-600">操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {perms.map(perm => (
                            <tr key={perm.id} className="border-t hover:bg-gray-50">
                              <td className="py-2 px-3">{perm.name}</td>
                              <td className="py-2 px-3 text-gray-500 font-mono text-xs">{perm.code}</td>
                              <td className="py-2 px-3 text-gray-500">{perm.description || '-'}</td>
                              <td className="py-2 px-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button variant="ghost" size="sm" onClick={() => openEdit(perm)}><Pencil className="h-3 w-3" /></Button>
                                  <Button variant="ghost" size="sm" onClick={() => setDeleteId(perm.id)}><Trash2 className="h-3 w-3 text-red-500" /></Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
          {grouped.length === 0 && (
            <div className="text-center py-8 text-gray-400">暂无应用数据</div>
          )}
        </Accordion>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editPerm ? '编辑权限' : '新建权限'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>所属功能</Label>
              <Select value={form.featureId} onValueChange={v => setForm(p => ({ ...p, featureId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="选择功能模块" />
                </SelectTrigger>
                <SelectContent>
                  {features.map(f => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.application?.name} / {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>权限名</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <Label>权限编码</Label>
              <Input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="例: user:read" />
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
            <AlertDialogDescription>确定要删除该权限吗？</AlertDialogDescription>
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
