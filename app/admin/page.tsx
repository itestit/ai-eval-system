import { prisma } from '@/lib/prisma'
import { Users, Ticket, Bot, FileText, Activity } from 'lucide-react'

export default async function AdminDashboard() {
  const [
    totalUsers,
    totalInvites,
    usedInvites,
    totalModels,
    totalFiles,
    recentLogs,
    todayEvals,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.inviteCode.count(),
    prisma.inviteCode.count({ where: { status: 'USED' } }),
    prisma.aIModel.count(),
    prisma.knowledgeFile.count(),
    prisma.auditLog.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.evalLog.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
  ])

  const stats = [
    { label: '总用户数', value: totalUsers, icon: Users, color: 'text-blue-500' },
    { label: '邀请码 (已用/总)', value: `${usedInvites}/${totalInvites}`, icon: Ticket, color: 'text-green-500' },
    { label: 'AI模型', value: totalModels, icon: Bot, color: 'text-purple-500' },
    { label: '知识库文件', value: totalFiles, icon: FileText, color: 'text-orange-500' },
    { label: '今日评测', value: todayEvals, icon: Activity, color: 'text-red-500' },
    { label: '24h日志', value: recentLogs, icon: Activity, color: 'text-cyan-500' },
  ]

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8">仪表盘</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-card rounded-xl p-6 shadow-sm border"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
              </div>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl p-6 shadow-sm border">
          <h2 className="font-semibold mb-4">快速操作</h2>
          <div className="space-y-3">
            <a
              href="/admin/invites"
              className="block p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <p className="font-medium">生成邀请码</p>
              <p className="text-sm text-muted-foreground">创建新的邀请码供用户注册使用</p>
            </a>
            <a
              href="/admin/models"
              className="block p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <p className="font-medium">配置AI模型</p>
              <p className="text-sm text-muted-foreground">添加或修改AI服务商配置</p>
            </a>
            <a
              href="/admin/prompts"
              className="block p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <p className="font-medium">编辑Prompt模板</p>
              <p className="text-sm text-muted-foreground">定制系统提示词和知识库引用</p>
            </a>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-sm border">
          <h2 className="font-semibold mb-4">系统状态</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">数据库连接</span>
              <span className="text-green-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                正常
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">文件存储</span>
              <span className="text-green-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                正常
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">AI服务</span>
              <span className="text-muted-foreground">依赖配置</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
