'use client'

import { useState } from 'react'
import { Download, Filter, MessageSquare, Eye, FileText, X, Search, Trash2, AlertTriangle, CheckSquare, Square } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EvalLog {
  id: string
  userId: string
  userEmail: string | null
  userName: string | null
  type: 'SUGGESTION' | 'POLICY'
  input: string
  output: string | null
  tokensUsed: number | null
  modelName: string | null
  modelProvider: string | null
  modelFullName: string | null
  createdAt: string
}

interface EvalLogsPageProps {
  logs: EvalLog[]
}

const typeLabels: Record<string, string> = {
  SUGGESTION: '建议模式',
  POLICY: '策略模式',
}

export default function EvalLogsPageClient({ logs: initialLogs }: EvalLogsPageProps) {
  const [logs, setLogs] = useState(initialLogs)
  const [filter, setFilter] = useState('')
  const [selectedLog, setSelectedLog] = useState<EvalLog | null>(null)
  const [dateRange, setDateRange] = useState('7')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [logToDelete, setLogToDelete] = useState<EvalLog | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const filteredLogs = logs.filter(log => {
    if (filter && !log.userEmail?.includes(filter) && !log.input.includes(filter)) {
      return false
    }
    if (dateRange) {
      const days = parseInt(dateRange)
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      if (new Date(log.createdAt) < cutoff) return false
    }
    return true
  })

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredLogs.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredLogs.map(log => log.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleDelete = async (log: EvalLog) => {
    setLogToDelete(log)
    setShowDeleteModal(true)
  }

  const handleBatchDelete = () => {
    setLogToDelete(null)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    setIsDeleting(true)
    try {
      if (logToDelete) {
        // 单条删除
        const res = await fetch(`/api/admin/eval-logs?id=${logToDelete.id}`, {
          method: 'DELETE'
        })
        if (res.ok) {
          setLogs(prev => prev.filter(l => l.id !== logToDelete.id))
          setSelectedIds(prev => {
            const newSet = new Set(prev)
            newSet.delete(logToDelete.id)
            return newSet
          })
        }
      } else if (selectedIds.size > 0) {
        // 批量删除
        const ids = Array.from(selectedIds).join(',')
        const res = await fetch(`/api/admin/eval-logs?ids=${ids}`, {
          method: 'DELETE'
        })
        if (res.ok) {
          setLogs(prev => prev.filter(l => !selectedIds.has(l.id)))
          setSelectedIds(new Set())
        }
      }
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败，请重试')
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
      setLogToDelete(null)
    }
  }

  const exportLogs = () => {
    const csv = [
      ['时间', '用户邮箱', '用户姓名', '模式', '输入内容', '输出摘要', 'Token用量', '模型'].join(','),
      ...filteredLogs.map(log => [
        new Date(log.createdAt).toLocaleString('zh-CN'),
        log.userEmail || '-',
        log.userName || '-',
        typeLabels[log.type] || log.type,
        `"${log.input.replace(/"/g, '""')}"`,
        log.output ? `"${log.output.slice(0, 100).replace(/"/g, '""')}${log.output.length > 100 ? '...' : ''}"` : '-',
        log.tokensUsed?.toString() || '-',
        log.modelName || '-',
      ].join(','))
    ].join('\n')

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `用户输入记录_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">用户输入记录</h1>
        </div>
        
        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && (
            <button
              onClick={handleBatchDelete}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="搜索用户邮箱或输入内容..."
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
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 hover:bg-muted/50 p-1 rounded"
                >
                  {selectedIds.size === filteredLogs.length && filteredLogs.length > 0 ? (
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Square className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">时间</th>
              <th className="px-4 py-3 text-left text-sm font-medium">用户</th>
              <th className="px-4 py-3 text-left text-sm font-medium">模式</th>
              <th className="px-4 py-3 text-left text-sm font-medium">输入内容</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Token用量</th>
              <th className="px-4 py-3 text-left text-sm font-medium">模型</th>
              <th className="px-4 py-3 text-left text-sm font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredLogs.map((log) => (
              <tr key={log.id} className={cn("hover:bg-muted/30", selectedIds.has(log.id) && "bg-blue-50/50")}>
                <td className="px-4 py-4">
                  <button
                    onClick={() => toggleSelect(log.id)}
                    className="p-1 hover:bg-muted/50 rounded"
                  >
                    {selectedIds.has(log.id) ? (
                      <CheckSquare className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Square className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                </td>
                <td className="px-4 py-4 text-sm">
                  {new Date(log.createdAt).toLocaleString('zh-CN')}
                </td>
                <td className="px-4 py-4 text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium">{log.userEmail || <span className="text-muted-foreground">未知用户</span>}</span>
                    {log.userName && <span className="text-xs text-muted-foreground">{log.userName}</span>}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    log.type === 'SUGGESTION' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {typeLabels[log.type] || log.type}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm max-w-md">
                  <div className="truncate" title={log.input}>
                    {log.input}
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-muted-foreground">
                  {log.tokensUsed || '-'}
                </td>
                <td className="px-4 py-4 text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium">{log.modelName || '-'}</span>
                    {log.modelProvider && (
                      <span className="text-xs text-muted-foreground">{log.modelProvider}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      查看
                    </button>
                    <button
                      onClick={() => handleDelete(log)}
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                  暂无评测记录
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold">评测详情</h2>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-auto flex-1">
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                  <span className="text-muted-foreground">用户:</span>
                  <span className="ml-2 font-medium">{selectedLog.userEmail || '未知'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">时间:</span>
                  <span className="ml-2 font-medium">{new Date(selectedLog.createdAt).toLocaleString('zh-CN')}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">模式:</span>
                  <span className="ml-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      selectedLog.type === 'SUGGESTION' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {typeLabels[selectedLog.type] || selectedLog.type}
                    </span>
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">模型:</span>
                  <span className="ml-2 font-medium">{selectedLog.modelName || '-'}</span>
                  {selectedLog.modelFullName && (
                    <span className="ml-1 text-muted-foreground">({selectedLog.modelFullName})</span>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground">Token用量:</span>
                  <span className="ml-2 font-medium">{selectedLog.tokensUsed || '-'}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    用户输入内容
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm whitespace-pre-wrap border">
                    {selectedLog.input}
                  </div>
                </div>

                {selectedLog.output && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      AI 回复内容
                    </h3>
                    <div className="bg-blue-50 rounded-lg p-4 text-sm whitespace-pre-wrap border border-blue-100 max-h-96 overflow-auto">
                      {selectedLog.output}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Delete button in modal */}
            <div className="px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => {
                  setSelectedLog(null)
                  handleDelete(selectedLog)
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                删除此记录
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold">确认删除</h3>
            </div>
            
            <p className="text-muted-foreground mb-6">
              {logToDelete ? (
                <>
                  确定要删除这条评测记录吗？此操作<strong>不可恢复</strong>。
                  <br /><br />
                  <span className="text-sm">用户: {logToDelete.userEmail || '未知'}</span>
                  <br />
                  <span className="text-sm">时间: {new Date(logToDelete.createdAt).toLocaleString('zh-CN')}</span>
                </>
              ) : (
                <>
                  确定要删除选中的 <strong>{selectedIds.size}</strong> 条记录吗？此操作<strong>不可恢复</strong>。
                </>
              )}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setLogToDelete(null)
                }}
                className="flex-1 py-2.5 rounded-lg border hover:bg-muted transition-colors"
                disabled={isDeleting}
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    删除中...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    确认删除
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
