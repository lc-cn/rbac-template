'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Plus, Pencil, Trash2, Save } from 'lucide-react'

interface SystemConfig {
  id: string
  key: string
  value: string
  group: string
  label?: string
}

interface OAuthProvider {
  id: string
  name: string
  type: string
  clientId: string
  clientSecret: string
  enabled: boolean
}

const OAUTH_TYPES = ['github', 'wechat', 'google', 'dingtalk', 'feishu', 'custom']

export default function SystemConfigPage() {
  const [configs, setConfigs] = useState<SystemConfig[]>([])
  const [providers, setProviders] = useState<OAuthProvider[]>([])
  const [generalForm, setGeneralForm] = useState<Record<string, string>>({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editProvider, setEditProvider] = useState<OAuthProvider | null>(null)
  const [providerForm, setProviderForm] = useState({
    name: '', type: 'github', clientId: '', clientSecret: '', enabled: false,
  })
  const { toast } = useToast()

  const fetchData = useCallback(async () => {
    try {
      const [configsRes, providersRes] = await Promise.all([
        fetch('/api/system-config'),
        fetch('/api/oauth-providers'),
      ])
      const configsData: SystemConfig[] = await configsRes.json()
      const providersData: OAuthProvider[] = await providersRes.json()
      setConfigs(configsData)
      setProviders(providersData)
      
      const generalConfigs = configsData.filter(c => c.group === 'general')
      const form: Record<string, string> = {}
      generalConfigs.forEach(c => { form[c.key] = c.value })
      setGeneralForm(form)
    } catch {
      toast({ title: '错误', description: '加载配置失败', variant: 'destructive' })
    }
  }, [toast])

  useEffect(() => { fetchData() }, [fetchData])

  const saveGeneralConfig = async () => {
    try {
      const configItems = [
        { key: 'site_name', value: generalForm['site_name'] || '', group: 'general', label: '站点名称' },
        { key: 'site_url', value: generalForm['site_url'] || '', group: 'general', label: '站点URL' },
        { key: 'admin_email', value: generalForm['admin_email'] || '', group: 'general', label: '管理员邮箱' },
        { key: 'session_timeout', value: generalForm['session_timeout'] || '3600', group: 'general', label: '会话超时(秒)' },
      ]
      const res = await fetch('/api/system-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs: configItems }),
      })
      if (!res.ok) throw new Error('保存失败')
      toast({ title: '成功', description: '系统配置已保存' })
      fetchData()
    } catch (error: any) {
      toast({ title: '错误', description: error.message, variant: 'destructive' })
    }
  }

  const openCreateProvider = () => {
    setEditProvider(null)
    setProviderForm({ name: '', type: 'github', clientId: '', clientSecret: '', enabled: false })
    setDialogOpen(true)
  }

  const openEditProvider = (provider: OAuthProvider) => {
    setEditProvider(provider)
    setProviderForm({
      name: provider.name,
      type: provider.type,
      clientId: provider.clientId,
      clientSecret: provider.clientSecret,
      enabled: provider.enabled,
    })
    setDialogOpen(true)
  }

  const handleProviderSubmit = async () => {
    try {
      const url = editProvider ? `/api/oauth-providers/${editProvider.id}` : '/api/oauth-providers'
      const res = await fetch(url, {
        method: editProvider ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(providerForm),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: '成功', description: editProvider ? '提供商已更新' : '提供商已创建' })
      setDialogOpen(false)
      fetchData()
    } catch (error: any) {
      toast({ title: '错误', description: error.message, variant: 'destructive' })
    }
  }

  const handleDeleteProvider = async () => {
    if (!deleteId) return
    try {
      await fetch(`/api/oauth-providers/${deleteId}`, { method: 'DELETE' })
      toast({ title: '成功', description: '提供商已删除' })
      fetchData()
    } catch {
      toast({ title: '错误', description: '删除失败', variant: 'destructive' })
    } finally {
      setDeleteId(null)
    }
  }

  const toggleProvider = async (provider: OAuthProvider) => {
    try {
      await fetch(`/api/oauth-providers/${provider.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...provider, enabled: !provider.enabled }),
      })
      fetchData()
    } catch {
      toast({ title: '错误', description: '更新失败', variant: 'destructive' })
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">系统配置</h1>
        <p className="text-gray-500 mt-1">管理系统全局配置和第三方登录</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="mb-6">
          <TabsTrigger value="general">通用配置</TabsTrigger>
          <TabsTrigger value="oauth">OAuth2 登录</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>通用配置</CardTitle>
              <CardDescription>系统基础配置信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>站点名称</Label>
                  <Input
                    value={generalForm['site_name'] || ''}
                    onChange={e => setGeneralForm(p => ({ ...p, site_name: e.target.value }))}
                    placeholder="RBAC 管理系统"
                  />
                </div>
                <div>
                  <Label>站点 URL</Label>
                  <Input
                    value={generalForm['site_url'] || ''}
                    onChange={e => setGeneralForm(p => ({ ...p, site_url: e.target.value }))}
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <Label>管理员邮箱</Label>
                  <Input
                    value={generalForm['admin_email'] || ''}
                    onChange={e => setGeneralForm(p => ({ ...p, admin_email: e.target.value }))}
                    placeholder="admin@example.com"
                  />
                </div>
                <div>
                  <Label>会话超时（秒）</Label>
                  <Input
                    value={generalForm['session_timeout'] || '3600'}
                    onChange={e => setGeneralForm(p => ({ ...p, session_timeout: e.target.value }))}
                    placeholder="3600"
                  />
                </div>
              </div>
              <Button onClick={saveGeneralConfig}>
                <Save className="h-4 w-4 mr-2" />保存配置
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="oauth">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>OAuth2 登录配置</CardTitle>
                  <CardDescription>配置第三方 OAuth2 登录提供商</CardDescription>
                </div>
                <Button onClick={openCreateProvider}>
                  <Plus className="h-4 w-4 mr-2" />添加提供商
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {providers.length === 0 ? (
                  <p className="text-center py-8 text-gray-400">暂无 OAuth2 提供商</p>
                ) : providers.map(provider => (
                  <div key={provider.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{provider.name}</span>
                          <Badge variant="outline" className="capitalize">{provider.type}</Badge>
                          <Badge variant={provider.enabled ? 'default' : 'secondary'}>
                            {provider.enabled ? '已启用' : '已禁用'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Client ID: {provider.clientId.substring(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={provider.enabled}
                        onCheckedChange={() => toggleProvider(provider)}
                      />
                      <Button variant="ghost" size="sm" onClick={() => openEditProvider(provider)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(provider.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editProvider ? '编辑提供商' : '添加提供商'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>名称</Label>
              <Input value={providerForm.name} onChange={e => setProviderForm(p => ({ ...p, name: e.target.value }))} placeholder="GitHub" />
            </div>
            <div>
              <Label>类型</Label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm mt-1"
                value={providerForm.type}
                onChange={e => setProviderForm(p => ({ ...p, type: e.target.value }))}
              >
                {OAUTH_TYPES.map(t => (
                  <option key={t} value={t} className="capitalize">{t}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Client ID</Label>
              <Input value={providerForm.clientId} onChange={e => setProviderForm(p => ({ ...p, clientId: e.target.value }))} />
            </div>
            <div>
              <Label>Client Secret</Label>
              <Input type="password" value={providerForm.clientSecret} onChange={e => setProviderForm(p => ({ ...p, clientSecret: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="providerEnabled"
                checked={providerForm.enabled}
                onCheckedChange={v => setProviderForm(p => ({ ...p, enabled: v }))}
              />
              <Label htmlFor="providerEnabled">启用</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleProviderSubmit}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>确定要删除该 OAuth2 提供商吗？</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProvider} className="bg-red-600 hover:bg-red-700">删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
