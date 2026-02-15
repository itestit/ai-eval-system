import { prisma } from '@/lib/prisma'
import { Users, Ticket, Bot, FileText, Activity, Zap, Settings, Plus } from 'lucide-react'
import Link from 'next/link'

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
    { label: '总用户数', value: totalUsers, icon: Users, color: 'blue' },
    { label: '邀请码', value: `${usedInvites}/${totalInvites}`, icon: Ticket, color: 'green' },
    { label: 'AI模型', value: totalModels, icon: Bot, color: 'purple' },
    { label: '知识库文件', value: totalFiles, icon: FileText, color: 'orange' },
    { label: '今日评测', value: todayEvals, icon: Activity, color: 'red' },
    { label: '24h日志', value: recentLogs, icon: Zap, color: 'cyan' },
  ]

  const colorClasses: Record<string, { bg: string; icon: string }> = {
    blue: { bg: 'bg-blue-100', icon: 'text-blue-600' },
    green: { bg: 'bg-green-100', icon: 'text-green-600' },
    purple: { bg: 'bg-purple-100', icon: 'text-purple-600' },
    orange: { bg: 'bg-orange-100', icon: 'text-orange-600' },
    red: { bg: 'bg-red-100', icon: 'text-red-600' },
    cyan: { bg: 'bg-cyan-100', icon: 'text-cyan-600' },
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">仪表盘</h1>
        <p className="text-gray-500 mt-2">欢迎回来，管理员</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => {
          const colors = colorClasses[stat.color]
          return (
            <div key={stat.label} className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className={`${colors.bg} p-3 rounded-lg`}>
                  <stat.icon className={`w-6 h-6 ${colors.icon}`} />
                </div>
                <span className="text-3xl font-bold text-gray-900">{stat.value}</span>
              </div>
              <p className="text-gray-500 text-sm mt-3 font-medium">{stat.label}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">快速操作</h2>
          <div className="space-y-3">
            <Link href="/admin/invites" className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100">
              <div className="bg-green-100 p-2 rounded-lg">
                <Plus className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">生成邀请码</p>
                <p className="text-sm text-gray-500">创建新的邀请码供用户注册使用</p>
              </div>
            </Link>
            <Link href="/admin/models" className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Settings className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">配置AI模型</p>
                <p className="text-sm text-gray-500">添加或修改AI服务商配置</p>
              </div>
            </Link>
            <Link href="/admin/prompts" className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">编辑Prompt模板</p>
                <p className="text-sm text-gray-500">定制系统提示词和知识库引用</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">系统状态</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">数据库连接</span>
              <span className="text-green-600 font-medium">正常</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">文件存储</span>
              <span className="text-green-600 font-medium">正常</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">AI服务</span>
              <span className="text-yellow-600 font-medium">需配置API Key</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
