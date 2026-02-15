'use client'

import { useState } from 'react'
import { Plus, Trash2, Edit2, Check, X, Power } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AIModel {
  id: string
  name: string
  provider: string
  baseUrl: string | null
  modelName: string
  isActive: boolean
}

interface ModelPageProps {
  models: AIModel[]
}

const providers = [
  { value: 'openai', label: 'OpenAI', defaultUrl: 'https://api.openai.com/v1' },
  { value: 'azure', label: 'Azure OpenAI', defaultUrl: '' },
  { value: 'deepseek', label: 'DeepSeek', defaultUrl: 'https://api.deepseek.com/v1' },
  { value: 'claude', label: 'Claude (Anthropic)', defaultUrl: 'https://api.anthropic.com/v1' },
  { value: 'moonshot', label: 'Moonshot (月之暗面)', defaultUrl: 'https://api.moonshot.cn/v1' },
  { value: 'glm', label: 'GLM (智谱AI)', defaultUrl: 'https://open.bigmodel.cn/api/paas/v4' },
  { value: 'custom', label: '自定义', defaultUrl: '' },
]

export default function ModelPageClient({ models }: ModelPageProps) {
  const [modelList, setModelList] = useState(models)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    provider: 'openai',
    baseUrl: '',
    apiKey: '',
    modelName: 'gpt-4-turbo',
  })

  const handleAdd = async () => {
    const res = await fetch('/api/admin/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    
    if (res.ok) {
      const data = await res.json()
      setModelList([data.model, ...modelList])
      setIsAdding(false)
      setFormData({
        name: '',
        provider: 'openai',
        baseUrl: '',
        apiKey: '',
        modelName: 'gpt-4-turbo',
      })
    }
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    const res = await fetch('/api/admin/models', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive: !isActive }),
    })
    
    if (res.ok) {
      setModelList(prev => prev.map(m => 
        m.id === id ? { ...m, isActive: !isActive } : m
      ))
    }
  }

  const deleteModel = async (id: string) => {
    if (!confirm('确定要删除这个模型配置吗？')) return
    
    const res = await fetch(`/api/admin/models?id=${id}`, {
      method: 'DELETE',
    })
    
    if (res.ok) {
      setModelList(prev => prev.filter(m => m.id !== id))
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">AI模型配置</h1>
        
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          添加模型
        </button>
      </div>

      <div className="grid gap-4">
        {modelList.map((model) => (
          <div
            key={model.id}
            className={cn(
              "bg-card rounded-xl p-6 border transition-all",
              model.isActive ? "border-green-200" : "border-gray-200 opacity-70"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg">{model.name}</h3>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs",
                    model.isActive 
                      ? "bg-green-100 text-green-700" 
                      : "bg-gray-100 text-gray-600"
                  )}>
                    {model.isActive ? '已启用' : '已禁用'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">服务商: </span>
                    <span className="font-medium">
                      {providers.find(p => p.value === model.provider)?.label || model.provider}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">模型: </span>
                    <span className="font-medium">{model.modelName}</span>
                  </div>
                  {model.baseUrl && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Base URL: </span>
                      <span className="font-mono text-xs">{model.baseUrl}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(model.id, model.isActive)}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    model.isActive 
                      ? "hover:bg-green-100 text-green-600" 
                      : "hover:bg-gray-100 text-gray-400"
                  )}
                  title={model.isActive ? '禁用' : '启用'}
                >
                  <Power className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteModel(model.id)}
                  className="p-2 rounded-lg hover:bg-red-100 text-red-500"
                  title="删除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modelList.length === 0 && (
        <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border">
          暂无模型配置，点击上方按钮添加
        </div>
      )}

      {/* Add Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">添加AI模型</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">显示名称 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="如：GPT-4 Turbo"
                  className="w-full px-3 py-2 rounded-lg border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">服务商 *</label>
                <select
                  value={formData.provider}
                  onChange={(e) => {
                    const provider = e.target.value
                    const defaultUrl = providers.find(p => p.value === provider)?.defaultUrl || ''
                    setFormData({ ...formData, provider, baseUrl: defaultUrl })
                  }}
                  className="w-full px-3 py-2 rounded-lg border"
                >
                  {providers.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Base URL (可选)</label>
                <input
                  type="text"
                  value={formData.baseUrl}
                  onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                  placeholder="https://api.openai.com/v1"
                  className="w-full px-3 py-2 rounded-lg border font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">API Key *</label>
                <input
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 rounded-lg border font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">模型名称 *</label>
                <input
                  type="text"
                  value={formData.modelName}
                  onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                  placeholder="gpt-4-turbo"
                  className="w-full px-3 py-2 rounded-lg border font-mono text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsAdding(false)}
                className="flex-1 py-2.5 rounded-lg border hover:bg-muted"
              >
                取消
              </button>
              <button
                onClick={handleAdd}
                disabled={!formData.name || !formData.apiKey || !formData.modelName}
                className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
