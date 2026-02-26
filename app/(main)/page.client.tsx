'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Copy, Check, Sparkles, AlertCircle, User, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface UserData {
  id: string
  email: string
  name: string | null
  remainingEvals: number
  isAdmin: boolean
}

interface Section {
  id: string
  name: string
  description: string | null
  promptTemplate: {
    id: string
    name: string
    type: string
    systemPrompt: string
  } | null
  // UI 配置字段
  inputLabel: string | null
  inputPlaceholder: string | null
  submitButtonText: string | null
  resultLabel: string | null
  emptyResultText: string | null
  loadingText: string | null
}

interface EvalPageProps {
  user: UserData
  pageHeader: string
  pageSubHeader: string
}

export default function EvalPageClient({ user, pageHeader, pageSubHeader }: EvalPageProps) {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showNoCreditModal, setShowNoCreditModal] = useState(false)
  
  // 板块相关状态
  const [sections, setSections] = useState<Section[]>([])
  const [selectedSectionId, setSelectedSectionId] = useState<string>('')
  const [sectionsLoading, setSectionsLoading] = useState(true)
  
  const outputRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Fetch config and sections on mount
  useEffect(() => {
    // 获取可访问的板块
    fetch('/api/user/sections')
      .then(res => {
        if (!res.ok) throw new Error('获取板块失败')
        return res.json()
      })
      .then(data => {
        if (data.sections?.length > 0) {
          setSections(data.sections)
          setSelectedSectionId(data.sections[0].id)
        }
      })
      .catch(console.error)
      .finally(() => setSectionsLoading(false))
  }, [])

  // 提取 <output> 标签之间的内容
  // 只在检测到完整的 <output> 标签后才开始显示内容
  const extractOutputContent = (text: string): string | null => {
    // 检查是否包含 <output> 标签开始
    const outputStartIndex = text.indexOf('<output>')
    if (outputStartIndex === -1) {
      // 还没有 <output> 标签，返回 null（不显示任何内容）
      return null
    }
    
    // 检查是否包含 </output> 标签结束
    const outputEndIndex = text.indexOf('</output>')
    if (outputEndIndex === -1) {
      // 有开始但没有结束，提取已累积的 <output> 标签内的内容
      const content = text.slice(outputStartIndex + 8) // 8 是 '<output>' 的长度
      return content.trim()
    }
    
    // 完整的 <output>...</output>，提取标签之间的内容
    const content = text.slice(outputStartIndex + 8, outputEndIndex)
    return content.trim()
  }

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return
    
    if (user.remainingEvals <= 0) {
      setShowNoCreditModal(true)
      return
    }

    setIsLoading(true)
    setOutput('')
    let rawOutput = ''

    try {
      const response = await fetch('/api/eval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          input: input.trim(),
          sectionId: selectedSectionId || undefined
        }),
      })

      if (!response.ok) {
        throw new Error('请求失败')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader!.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            
            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                rawOutput += parsed.content
                // 提取 <output> 标签内容并显示
                const extracted = extractOutputContent(rawOutput)
                // 只在检测到 <output> 标签后才更新显示
                if (extracted !== null) {
                  setOutput(extracted)
                  // Auto scroll
                  if (outputRef.current) {
                    outputRef.current.scrollTop = outputRef.current.scrollHeight
                  }
                }
              }
            } catch {
              // Ignore parse errors for [DONE] or empty lines
            }
          }
        }
      }

      // Refresh to get updated remaining count
      router.refresh()
    } catch (error) {
      console.error('评测失败:', error)
      setOutput('评测过程中出现错误，请稍后重试。')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  const remainingZero = user.remainingEvals <= 0
  
  const selectedSection = sections.find(s => s.id === selectedSectionId)

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-16 border-b flex items-center justify-between px-4 lg:px-6 bg-gradient-to-r from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-semibold text-slate-800 dark:text-slate-100">{pageHeader}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">{pageSubHeader}</p>
            </div>
          </div>
          
          {/* 板块选择器 */}
          {sections.length > 0 && (
            <div className="hidden md:flex items-center gap-2 ml-2 pl-4 border-l border-slate-200 dark:border-slate-700">
              <div className="relative">
                <LayoutGrid className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="pl-9 pr-8 py-2 rounded-full border-0 bg-slate-100 dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors min-w-[160px] appearance-none cursor-pointer"
                  disabled={isLoading}
                >
                  {sectionsLoading ? (
                    <option>加载中...</option>
                  ) : (
                    sections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.name}
                      </option>
                    ))
                  )}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
            remainingZero 
              ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400" 
              : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
          )}>
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
            <span>剩余 {user.remainingEvals} 次</span>
          </div>
          
          <button
            onClick={() => router.push('/settings')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors group"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">{(user.name || user.email).charAt(0).toUpperCase()}</span>
            </div>
            <span className="hidden sm:inline text-sm text-slate-700 dark:text-slate-200 font-medium">{user.name || user.email}</span>
          </button>
        </div>
      </header>

      {/* Mobile Section Selector */}
      {sections.length > 0 && (
        <div className="md:hidden px-4 py-2 border-b bg-card">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-muted-foreground" />
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border text-sm bg-background"
              disabled={isLoading}
            >
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Section Description */}
      {selectedSection?.description && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
          <p className="text-sm text-blue-700">{selectedSection.description}</p>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel - Input */}
        <div className="flex-1 flex flex-col border-r">
          <div className="flex-1 p-4 lg:p-6">
            <label className="block text-sm font-medium mb-2 text-muted-foreground">
              {selectedSection?.inputLabel || '输入需要评测的文本'}
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={(() => {
                const basePlaceholder = selectedSection?.inputPlaceholder || '在此粘贴您需要评测的文本内容...'
                if (selectedSection?.promptTemplate?.systemPrompt) {
                  return `当前功能：${selectedSection.promptTemplate.name}\n${basePlaceholder}`
                }
                return basePlaceholder
              })()}
              className="w-full h-full min-h-[300px] resize-none rounded-lg border bg-background p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              disabled={isLoading || remainingZero}
            />
          </div>
          
          <div className="p-4 lg:p-6 border-t bg-card">
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading || remainingZero}
              className={cn(
                "w-full py-3 px-6 rounded-lg font-medium flex items-center justify-center gap-2 transition-all",
                remainingZero
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : isLoading
                  ? "bg-primary/80 text-primary-foreground cursor-wait"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  评测中...
                </>
              ) : remainingZero ? (
                <>
                  <AlertCircle className="w-4 h-4" />
                  次数已用完
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {selectedSection?.submitButtonText || '开始评测'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Panel - Output */}
        <div className="flex-1 flex flex-col bg-muted/30">
          <div className="flex-1 p-4 lg:p-6 overflow-auto" ref={outputRef}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-muted-foreground">
                {selectedSection?.resultLabel || '评测结果'}
              </label>
              {output && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs rounded hover:bg-muted transition-colors"
                  title="复制内容"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-500" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      复制
                    </>
                  )}
                </button>
              )}
            </div>
            
            <div className="prose prose-sm max-w-none markdown-content">
              {output ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {output}
                </ReactMarkdown>
              ) : (
                <div className="text-muted-foreground text-center py-20">
                  {isLoading ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      <p className="text-sm">{selectedSection?.loadingText || 'AI 正在分析中...'}</p>
                    </div>
                  ) : (
                    <p className="text-sm">{selectedSection?.emptyResultText || '评测结果将在这里显示'}</p>
                  )}
                </div>
              )}
              {isLoading && output && <span className="typing-cursor" />}
            </div>
          </div>
        </div>
      </main>

      {/* No Credit Modal */}
      {showNoCreditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 max-w-md w-full shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-destructive" />
              <h3 className="text-lg font-semibold">次数已用尽</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              您的可用评测次数已用尽，请联系管理员充值。
            </p>
            <div className="bg-muted p-4 rounded-lg mb-6">
              <p className="text-sm font-medium mb-2">联系方式：</p>
              <p className="text-sm">{process.env.NEXT_PUBLIC_CONTACT || '请联系管理员'}</p>
            </div>
            <button
              onClick={() => setShowNoCreditModal(false)}
              className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              知道了
            </button>
          </div>
        </div>
      )}
    </div>
  )
}