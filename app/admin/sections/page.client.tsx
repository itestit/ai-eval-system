'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, LayoutGrid, Eye, EyeOff, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Section {
  id: string
  name: string
  description: string | null
  isActive: boolean
  visibility: 'ALL' | 'SPECIFIC'
  sortOrder: number
  promptTemplateId: string | null
  promptTemplate: { id: string; name: string } | null
  accessUsers: { userId: string }[]
  createdAt: string
  updatedAt: string
}

interface PromptTemplate {
  id: string
  name: string
  type: string
}

interface User {
  id: string
  email: string
  name: string | null
}

interface SectionsPageProps {
  sections: Section[]
  promptTemplates: PromptTemplate[]
  users: User[]
}

export default function SectionsPageClient({ sections, promptTemplates, users }: SectionsPageProps) {
  const [sectionList, setSectionList] = useState(sections)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<Section | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    promptTemplateId: '',
    visibility: 'ALL' as 'ALL' | 'SPECIFIC',
    accessUserIds: [] as string[],
    isActive: true,
    sortOrder: 0
  })

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      promptTemplateId: '',
      visibility: 'ALL',
      accessUserIds: [],
      isActive: true,
      sortOrder: sectionList.length
    })
    setEditingSection(null)
  }

  const openCreateModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const openEditModal = (section: Section) => {
    setEditingSection(section)
    setFormData({
      name: section.name,
      description: section.description || '',
      promptTemplateId: section.promptTemplateId || '',
      visibility: section.visibility,
      accessUserIds: section.accessUsers.map(u => u.userId),
      isActive: section.isActive,
      sortOrder: section.sortOrder
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = '/api/admin/sections'
      const method = editingSection ? 'PATCH' : 'POST'
      const body = editingSection 
        ? { ...formData, id: editingSection.id }
        : formData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        const data = await res.json()
        if (editingSection) {
          setSectionList(prev => prev.map(s => s.id === data.section.id ? data.section : s))
        } else {
          setSectionList(prev => [...prev, data.section])
        }
        setIsModalOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error('保存失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个板块吗？')) return

    try {
      const res = await fetch(`/api/admin/sections?id=${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setSectionList(prev => prev.filter(s => s.id !== id))
      }
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const toggleUserAccess = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      accessUserIds: prev.accessUserIds.includes(userId)
        ? prev.accessUserIds.filter(id => id !== userId)
        : [...prev.accessUserIds, userId]
    }))
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <LayoutGrid className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">板块管理</h1>
        </div>
        
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          创建板块
        </button>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium">排序</th>
              <th className="px-6 py-3 text-left text-sm font-medium">板块名称</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Prompt模板</th>
              <th className="px-6 py-3 text-left text-sm font-medium">可见性</th>
              <th className="px-6 py-3 text-left text-sm font-medium">状态</th>
              <th className="px-6 py-3 text-right text-sm font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sectionList.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                  暂无板块，点击右上角创建
                </td>
              </tr>
            ) : (
              sectionList.map((section) => (
                <tr key={section.id} className="hover:bg-muted/30">
                  <td className="px-6 py-4 text-sm">{section.sortOrder}</td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium">{section.name}</p>
                      {section.description && (
                        <p className="text-sm text-muted-foreground">{section.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {section.promptTemplate?.name || <span className="text-muted-foreground">未配置</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "flex items-center gap-1.5 text-sm",
                      section.visibility === 'ALL' ? "text-green-600" : "text-orange-600"
                    )}>
                      {section.visibility === 'ALL' ? (
                        <>
                          <Eye className="w-4 h-4" />
                          全部可见
                        </>
                      ) : (
                        <>
                          <Users className="w-4 h-4" />
                          指定用户
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      section.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    )}>
                      {section.isActive ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(section)}
                        className="p-2 rounded-lg hover:bg-muted"
                        title="编辑"
                      >
                        <Pencil className="w-4 h-4 text-blue-500" />
                      </button>
                      <button
                        onClick={() => handleDelete(section.id)}
                        className="p-2 rounded-lg hover:bg-muted"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-auto">
            <h3 className="text-lg font-semibold mb-6">
              {editingSection ? '编辑板块' : '创建板块'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">板块名称 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border"
                  placeholder="请输入板块名称"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border"
                  placeholder="可选：输入板块描述"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">关联Prompt模板</label>
                <select
                  value={formData.promptTemplateId}
                  onChange={(e) => setFormData({ ...formData, promptTemplateId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border"
                >
                  <option value="">不关联模板</option>
                  {promptTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.type === 'SUGGESTION' ? '建议' : '策略'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">排序</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border"
                    min={0}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">状态</label>
                  <select
                    value={formData.isActive ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                    className="w-full px-3 py-2 rounded-lg border"
                  >
                    <option value="true">启用</option>
                    <option value="false">禁用</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">可见性</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="ALL"
                      checked={formData.visibility === 'ALL'}
                      onChange={() => setFormData({ ...formData, visibility: 'ALL' })}
                      className="rounded"
                    />
                    <span>全部用户可见</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="SPECIFIC"
                      checked={formData.visibility === 'SPECIFIC'}
                      onChange={() => setFormData({ ...formData, visibility: 'SPECIFIC' })}
                      className="rounded"
                    />
                    <span>仅指定用户可见</span>
                  </label>
                </div>
              </div>

              {formData.visibility === 'SPECIFIC' && (
                <div className="border rounded-lg p-4 max-h-48 overflow-auto">
                  <label className="block text-sm font-medium mb-2">选择可访问的用户</label>
                  <div className="space-y-2">
                    {users.map((user) => (
                      <label key={user.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.accessUserIds.includes(user.id)}
                          onChange={() => toggleUserAccess(user.id)}
                          className="rounded"
                        />
                        <span className="text-sm">
                          {user.name || user.email}
                          <span className="text-muted-foreground ml-1">({user.email})</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false)
                    resetForm()
                  }}
                  className="flex-1 py-2.5 rounded-lg border hover:bg-muted"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !formData.name}
                  className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}