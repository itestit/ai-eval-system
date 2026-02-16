'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Copy, Check, Sparkles, AlertCircle, User } from 'lucide-react'
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

interface EvalPageProps {
  user: UserData
}

export default function EvalPageClient({ user }: EvalPageProps) {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showNoCreditModal, setShowNoCreditModal] = useState(false)
  const [pageHeader, setPageHeader] = useState('AI智能评测')
  const outputRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Fetch config on mount
  useEffect(() => {
    fetch('/api/config?t=' + Date.now())
      .then(res => res.json())
      .then(data => {
        if (data.pageHeader) {
          setPageHeader(data.pageHeader)
        }
      })
      .catch(console.error)
  }, [])

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return
    
    if (user.remainingEvals <= 0) {
      setShowNoCreditModal(true)
      return
    }

    setIsLoading(true)
    setOutput('')

    try {
      const response = await fetch('/api/eval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: input.trim() }),
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
                setOutput(prev => prev + parsed.content)
                // Auto scroll
                if (outputRef.current) {
                  outputRef.current.scrollTop = outputRef.current.scrollHeight
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

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-16 border-b flex items-center justify-between px-4 lg:px-6 bg-card">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <h1 className="text-lg font-semibold">{pageHeader}</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            剩余次数：<span className={cn(
              "font-medium",
              remainingZero ? "text-destructive" : "text-primary"
            )}>{user.remainingEvals}</span>
          </div>
          <button
            onClick={() => router.push('/settings')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">{user.name || user.email}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel - Input */}
        <div className="flex-1 flex flex-col border-r">
          <div className="flex-1 p-4 lg:p-6">
            <label className="block text-sm font-medium mb-2 text-muted-foreground">
              输入需要评测的文本
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="在此粘贴您需要评测的文本内容..."
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
                  开始评测
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
                评测结果
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
                      <p className="text-sm">正在生成评测结果...</p>
                    </div>
                  ) : (
                    <p className="text-sm">评测结果将在这里显示</p>
                  )}
                </div>
              )}
              {isLoading && <span className="typing-cursor" />}
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
