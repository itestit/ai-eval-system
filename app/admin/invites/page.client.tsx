'use client'

import { useState } from 'react'
import { Copy, Download, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InviteCode {
  id: string
  code: string
  status: 'UNUSED' | 'USED'
  createdAt: string
  usedAt: string | null
}

interface InviteCodePageProps {
  codes: InviteCode[]
}

export default function InviteCodePageClient({ codes }: InviteCodePageProps) {
  const [inviteCodes, setInviteCodes] = useState(codes)
  const [isGenerating, setIsGenerating] = useState(false)
  const [count, setCount] = useState(10)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const generateCodes = async () => {
    setIsGenerating(true)
    try {
      const res = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count }),
      })
      
      if (res.ok) {
        const data = await res.json()
        setInviteCodes([...data.codes, ...inviteCodes])
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const exportCodes = () => {
    const unusedCodes = inviteCodes.filter(c => c.status === 'UNUSED')
    const csv = [
      ['邀请码', '状态', '创建时间'].join(','),
      ...unusedCodes.map(c => [
        c.code,
        c.status,
        new Date(c.createdAt).toLocaleString('zh-CN'),
      ].join(','))
    ].join('\n')

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `邀请码_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const unusedCount = inviteCodes.filter(c => c.status === 'UNUSED').length
  const usedCount = inviteCodes.filter(c => c.status === 'USED').length

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">邀请码管理</h1>
        
        <div className="flex items-center gap-3">
          <button
            onClick={exportCodes}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-muted transition-colors"
          >
            <Download className="w-4 h-4" />
            导出未使用
          </button>
          
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-20 px-3 py-2 rounded-lg border text-center"
            />
            <button
              onClick={generateCodes}
              disabled={isGenerating}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                isGenerating
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  生成
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="bg-card px-4 py-3 rounded-lg border">
          <span className="text-muted-foreground text-sm">未使用: </span>
          <span className="font-semibold text-green-600">{unusedCount}</span>
        </div>
        <div className="bg-card px-4 py-3 rounded-lg border">
          <span className="text-muted-foreground text-sm">已使用: </span>
          <span className="font-semibold text-muted-foreground">{usedCount}</span>
        </div>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium">邀请码</th>
              <th className="px-6 py-3 text-left text-sm font-medium">状态</th>
              <th className="px-6 py-3 text-left text-sm font-medium">创建时间</th>
              <th className="px-6 py-3 text-left text-sm font-medium">使用时间</th>
              <th className="px-6 py-3 text-right text-sm font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {inviteCodes.map((code) => (
              <tr key={code.id} className="hover:bg-muted/30">
                <td className="px-6 py-4 font-mono text-sm">{code.code}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    code.status === 'UNUSED'
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  )}>
                    {code.status === 'UNUSED' ? '未使用' : '已使用'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {new Date(code.createdAt).toLocaleString('zh-CN')}
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {code.usedAt ? new Date(code.usedAt).toLocaleString('zh-CN') : '-'}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => copyCode(code.code, code.id)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                    title="复制"
                  >
                    {copiedId === code.id ? (
                      <span className="text-green-500 text-xs">已复制</span>
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </td>
              </tr>
            ))}
            {inviteCodes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                  暂无邀请码，点击上方按钮生成
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
