import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { 
  LayoutDashboard, 
  Users, 
  Ticket, 
  Bot, 
  Settings,
  ScrollText,
  LogOut,
  Cog,
  MessageSquare,
  LayoutGrid,
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

  // 从数据库获取网站标题
  const siteTitleConfig = await prisma.systemConfig.findUnique({
    where: { key: 'siteTitle' }
  })
  const siteTitle = siteTitleConfig?.value || 'AI评测系统'

  const navItems = [
    { href: '/admin', label: '仪表盘', icon: LayoutDashboard },
    { href: '/admin/users', label: '用户管理', icon: Users },
    { href: '/admin/sections', label: '板块管理', icon: LayoutGrid },
    { href: '/admin/invites', label: '邀请码', icon: Ticket },
    { href: '/admin/models', label: '模型配置', icon: Bot },
    { href: '/admin/prompts', label: 'Prompt模板', icon: ScrollText },
    { href: '/admin/files', label: '知识库', icon: Settings },
    { href: '/admin/eval-logs', label: '用户输入记录', icon: MessageSquare },
    { href: '/admin/logs', label: '日志审计', icon: ScrollText },
    { href: '/admin/settings', label: '系统设置', icon: Cog },
  ]

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="min-h-[4rem] flex items-center px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-semibold text-white text-sm leading-tight break-words">{siteTitle}</h1>
          </div>
        </div>
        
        <nav className="flex-1 p-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-700 hover:bg-gray-100 mb-1"
            >
              <item.icon className="w-5 h-5 text-gray-500" />
              {item.label}
            </Link>
          ))}
        </nav>
        
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <span className="truncate">{user.email}</span>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-3 px-4 py-2 w-full rounded-lg text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-5 h-5" />
              退出登录
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 bg-gray-50 overflow-auto">
        {children}
      </main>
    </div>
  )
}
