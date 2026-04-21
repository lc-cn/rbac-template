'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Users,
  Shield,
  Key,
  AppWindow,
  Layers,
  Settings,
  LayoutDashboard,
} from 'lucide-react'

const navItems = [
  { href: '/', label: '控制台', icon: LayoutDashboard },
  { href: '/users', label: '用户管理', icon: Users },
  { href: '/roles', label: '角色管理', icon: Shield },
  { href: '/permissions', label: '权限管理', icon: Key },
  { href: '/applications', label: '应用管理', icon: AppWindow },
  { href: '/features', label: '功能管理', icon: Layers },
  { href: '/system-config', label: '系统配置', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-xl font-bold text-white">RBAC 管理系统</h1>
        <p className="text-xs text-gray-400 mt-1">权限管理平台</p>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-700">
        <p className="text-xs text-gray-500 text-center">v1.0.0</p>
      </div>
    </aside>
  )
}
