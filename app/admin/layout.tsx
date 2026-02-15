import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { 
  LayoutDashboard, 
  Users, 
  Ticket, 
  Bot, 
  Settings,
  ScrollText,
  LogOut,
} from 'lucide-react'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  
  if (!user?.isAdmin) {
    redirect('/')
  }

  const navItems = [
    { href: '/admin', label: '仪表盘', icon: LayoutDashboard },
    { href: '/admin/users', label: '用户管理', icon: Users },
    { href: '/admin/invites', label: '邀请码', icon: Ticket },
    { href: '/admin/models', label: '模型配置', icon: Bot },
    { href: '/admin/prompts', label: 'Prompt模板', icon: ScrollText },
    { href: '/admin/files', label: '知识库', icon: Settings },
    { href: '/admin/logs', label: '日志审计', icon: ScrollText },
  ]

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="h-16 flex items-center px-6 border-b border-gray-200 bg-gray-900">
          <h1 className="font-bold text-white text-lg">AI评测系统</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all"
            >
              <item.icon className="w-5 h-5 text-gray-500" />
              {item.label}
            </Link>
          ))}
        </nav>
        
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <span className="flex-1 truncate font-medium">{user.email}</span>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-3 px-4 py-2 w-full rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              退出登录
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
