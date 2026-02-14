'use client'

import { useState, useEffect, useCallback } from 'react'
import { Save, FileText, AtSign, Trash2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PromptTemplate {
  id: string
  name: string
  type: 'SUGGESTION' | 'POLICY'
  systemPrompt: string
  attachedFiles: string[]
  modelId: string | null
}

interface KnowledgeFile {
  id: string
  name: string
  type: string
  size: number
}

interface AIModel {
  id: string
  name: string
}

interface PromptPageProps {
  prompts: PromptTemplate[]
  files: KnowledgeFile[]
  models: AIModel[]
}

export default function PromptPageClient({ prompts, files, models }: PromptPageProps) {
  const [promptList, setPromptList] = useState(prompts)
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(prompts[0] || null)
  const [isSaving, setIsSaving] = useState(false)
  const [showFilePicker, setShowFilePicker] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)
  const textareaRef = useState<HTMLTextAreaElement | null>(null)

  const handleSave = async () => {
    if (!selectedPrompt) return
    
    setIsSaving(true)
    try {
      const res = await fetch('/api/admin/prompts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedPrompt),
      })
      
      if (res.ok) {
        setPromptList(prev => prev.map(p => 
          p.id === selectedPrompt.id ? selectedPrompt : p
        ))
      }
    } finally {
      setIsSaving(false)
    }
  }

  const addFileReference = (file: KnowledgeFile) => {
    if (!selectedPrompt) return
    
    const fileRef = `@${file.name}`
    const beforeCursor = selectedPrompt.systemPrompt.slice(0, cursorPosition)
    const afterCursor = selectedPrompt.systemPrompt.slice(cursorPosition)
    
    setSelectedPrompt({
      ...selectedPrompt,
      systemPrompt: beforeCursor + fileRef + afterCursor,
      attachedFiles: [...new Set([...selectedPrompt.attachedFiles, file.id])]
    })
    setShowFilePicker(false)
  }

  const insertAtSign = () => {
    const textarea = document.getElementById('prompt-editor') as HTMLTextAreaElement
    if (textarea) {
      setCursorPosition(textarea.selectionStart)
      setShowFilePicker(true)
    }
  }

  const createNewPrompt = async () => {
    const name = prompt('请输入模板名称:')
    if (!name) return
    
    const res = await fetch('/api/admin/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        type: 'SUGGESTION',
        systemPrompt: '请对以下文本进行评测：\n\n{{user_input}}',
      }),
    })
    
    if (res.ok) {
      const data = await res.json()
      setPromptList([...promptList, data.prompt])
      setSelectedPrompt(data.prompt)
    }
  }

  const deletePrompt = async (id: string) => {
    if (!confirm('确定要删除这个模板吗？')) return
    
    const res = await fetch(`/api/admin/prompts?id=${id}`, {
      method: 'DELETE',
    })
    
    if (res.ok) {
      const newList = promptList.filter(p => p.id !== id)
      setPromptList(newList)
      setSelectedPrompt(newList[0] || null)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Prompt 模板管理</h1>
        
        <button
          onClick={createNewPrompt}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          新建模板
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 bg-card rounded-xl border overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-medium">模板列表</h2>
          </div>
          <div className="divide-y">
            {promptList.map((prompt) => (
              <button
                key={prompt.id}
                onClick={() => setSelectedPrompt(prompt)}
                className={cn(
                  "w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center justify-between",
                  selectedPrompt?.id === prompt.id && "bg-muted"
                )}
              >
                <div>
                  <p className="font-medium text-sm">{prompt.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {prompt.type === 'SUGGESTION' ? '建议评测' : '政策评测'}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deletePrompt(prompt.id)
                  }}
                  className="p-1.5 rounded hover:bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </button>
            ))}
            {promptList.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                暂无模板
              </div>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 bg-card rounded-xl border p-6">
          {selectedPrompt ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">模板名称</label>
                  <input
                    type="text"
                    value={selectedPrompt.name}
                    onChange={(e) => setSelectedPrompt({ ...selectedPrompt, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">类型</label>
                  <select
                    value={selectedPrompt.type}
                    onChange={(e) => setSelectedPrompt({ 
                      ...selectedPrompt, 
                      type: e.target.value as 'SUGGESTION' | 'POLICY' 
                    })}
                    className="px-3 py-2 rounded-lg border"
                  >
                    <option value="SUGGESTION">建议评测</option>
                    <option value="POLICY">政策评测</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">关联模型</label>
                  <select
                    value={selectedPrompt.modelId || ''}
                    onChange={(e) => setSelectedPrompt({ 
                      ...selectedPrompt, 
                      modelId: e.target.value || null 
                    })}
                    className="px-3 py-2 rounded-lg border"
                  >
                    <option value="">自动选择</option>
                    {models.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium mb-1">
                  系统提示词
                  <span className="text-muted-foreground font-normal ml-2">
                    使用 {'{{user_input}}'} 作为用户输入占位符
                  </span>
                </label>
                
                <div className="relative">
                  <textarea
                    id="prompt-editor"
                    ref={(el) => {
                      if (el) {
                        const textarea = document.getElementById('prompt-editor') as HTMLTextAreaElement
                        if (textarea) {
                          textarea.onselect = () => setCursorPosition(textarea.selectionStart)
                          textarea.onclick = () => setCursorPosition(textarea.selectionStart)
                          textarea.onkeyup = () => setCursorPosition(textarea.selectionStart)
                        }
                      }
                    }}
                    value={selectedPrompt.systemPrompt}
                    onChange={(e) => setSelectedPrompt({ 
                      ...selectedPrompt, 
                      systemPrompt: e.target.value 
                    })}
                    rows={15}
                    className="w-full px-3 py-2 rounded-lg border font-mono text-sm resize-none"
                    placeholder="输入系统提示词..."
                  />
                  
                  <button
                    onClick={insertAtSign}
                    className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-sm flex items-center gap-1.5"
                  >
                    <AtSign className="w-4 h-4" />
                    引用文件
                  </button>
                </div>
                
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedPrompt.attachedFiles.map(fileId => {
                    const file = files.find(f => f.id === fileId)
                    return file ? (
                      <span 
                        key={fileId}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs"
                      >
                        <FileText className="w-3 h-3" />
                        @{file.name}
                      </span>
                    ) : null
                  })}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? '保存中...' : '保存模板'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>选择一个模板或创建新模板</p>
            </div>
          )}
        </div>
      </div>

      {/* File Picker Modal */}
      {showFilePicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
>
          <div className="bg-card rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">选择知识库文件</h3>
            
            {files.length > 0 ? (
              <div className="space-y-2">
                {files.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => addFileReference(file)}
                    className="w-full p-3 rounded-lg border hover:bg-muted text-left flex items-center gap-3"
                  >
                    <FileText className="w-5 h-5 text-blue-500" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                暂无知识库文件，请先上传
              </div>
            )}
            
            <button
              onClick={() => setShowFilePicker(false)}
              className="w-full mt-4 py-2.5 rounded-lg border hover:bg-muted"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
