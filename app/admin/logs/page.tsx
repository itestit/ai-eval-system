'use client'

import { useState, useEffect } from 'react'
import { Download, Filter, Activity, LogIn, FileText, UserCog, Trash2, AlertTriangle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AuditLog {
  id: string
  action: string
  userId: string | null
  userEmail: string | null
  ip: string | null
  metadata: any
  createdAt: string
}

const actionLabels: Record<string, { label: string; icon: any; color: string }> = {
  LOGIN: { label: '登录', icon: LogIn, color: 'text-green-600' },
  LOGOUT: { label: '登出', icon: LogIn, color: 'text-gray-500' },
  REGISTER: { label: '注册', icon: UserCog, color: 'text-blue-600' },
  EVAL: { label: '评测', icon: FileText, color: 'text-purple-600' },
  EVAL_ERROR: { label: '评测错误', icon: AlertTriangle, color: 'text-red-600' },
  PASSWORD_CHANGE: { label: '修改密码', icon: UserCog, color: 'text-orange-600' },
  ADMIN_ADD_EVALS: { label: '充值额度', icon: Activity, color: 'text-green-600' },
}

export default function LogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [dateRange, setDateRange] = useState('7')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/logs')
      if (!res.ok) throw new Error('获取日志失败')
      const data = await res.json()
      setLogs(data.logs || [])
    } catch (error) {
      console.error('获取日志失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const filteredLogs = logs.filter(log => {
    if (filter && !log.action.includes(filter) && !log.userEmail?.includes(filter)) {
      return false
    }
    if (dateRange) {
      const days = parseInt(dateRange)
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      if (new Date(log.createdAt) < cutoff) return false
    }
    return true
  })

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const toggleAll = () => {
    if (selectedIds.size === filteredLogs.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredLogs.map(log => log.id)))
    }
  }

  const deleteLogs = async (ids: string[]) => {
    if (!confirm(`确定要删除选中的 ${ids.length} 条日志吗？`)) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/logs?ids=${ids.join(',')}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('删除失败')
      }

      setLogs(logs.filter(log => !ids.includes(log.id)))
      setSelectedIds(new Set())
    } catch (error) {
      alert('删除失败，请重试')
      console.error(error)
    } finally {
      setIsDeleting(false)
    }
  }

  const exportLogs = () => {
    const csv = [
      ['时间', '用户', '操作', 'IP', '详情'].join(','),
      ...filteredLogs.map(log => [
        new Date(log.createdAt).toLocaleString('zh-CN'),
        log.userEmail || '系统',
        actionLabels[log.action]?.label || log.action,
        log.ip || '-',
        JSON.stringify(log.metadata || {}),
      ].join(','))
    ].join('\n')

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `审计日志_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">日志审计</h1>
        
        <div className="flex gap-2">
          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-muted"
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
          
          {selectedIds.size > 0 && (
            <button
              onClick={() => deleteLogs(Array.from(selectedIds))}
              disabled={isDeleting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              批量删除 ({selectedIds.size})
            </button>
          )}
          
          <button
            onClick={exportLogs}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-muted"
          >
            <Download className="w-4 h-4" />
            导出
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="搜索操作或用户..."
            className="pl-10 pr-4 py-2 rounded-lg border w-full"
          />
        </div>
        
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 rounded-lg border"
        >
          <option value="1">今天</option>
          <option value="7">最近7天</option>
          <option value="30">最近30天</option>
          <option value="">全部</option>
        </select>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filteredLogs.length && filteredLogs.length > 0}
                  onChange={toggleAll}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">时间</th>
              <th className="px-4 py-3 text-left text-sm font-medium">用户</th>
              <th className="px-4 py-3 text-left text-sm font-medium">操作</th>
              <th className="px-4 py-3 text-left text-sm font-medium">IP</th>
              <th className="px-4 py-3 text-left text-sm font-medium">详情</th>
              <th className="px-4 py-3 text-left text-sm font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredLogs.map((log) => {
              const actionInfo = actionLabels[log.action] || { 
                label: log.action, 
                icon: Activity, 
                color: 'text-gray-500' 
              }
              const Icon = actionInfo.icon
              
              return (
                <tr key={log.id} className="hover:bg-muted/30">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(log.id)}
                      onChange={() => toggleSelection(log.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-4 text-sm">
                    {new Date(log.createdAt).toLocaleString('zh-CN')}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    {log.userEmail || <span className="text-muted-foreground">系统</span>}
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn("flex items-center gap-2 text-sm", actionInfo.color)}>
                      <Icon className="w-4 h-4" />
                      {actionInfo.label}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground font-mono">
                    {log.ip || '-'}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    {log.metadata && Object.keys(log.metadata).length > 0 ? (
                      <pre className="text-xs bg-muted p-2 rounded overflow-auto max-w-xs">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => deleteLogs([log.id])}
                      disabled={isDeleting}
                      className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                  暂无日志记录
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}