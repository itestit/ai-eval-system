import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { 
  LayoutDashboard, 
  Users, 
  Ticket, 
  Bot, 
  FileText, 
  ScrollText,
  LogOut,
  Settings
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
    { href: '/admin/prompts', label: 'Prompt模板', icon: FileText },
    { href: '/admin/files', label: '知识库', icon: Settings },
    { href: '/admin/logs', label: '日志审计', icon: ScrollText },
  ]

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r flex flex-col">
        <div className="h-16 flex items-center px-6 border-b">
          <h1 className="font-semibold">管理后台</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        
        <div className="p-4 border-t">
          <div className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground">
            <span className="flex-1 truncate">{user.email}</span>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              退出登录
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-background overflow-auto">
        {children}
      </main>
    </div>
  )
}
