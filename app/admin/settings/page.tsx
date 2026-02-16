'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Settings, Globe, Type } from 'lucide-react'

export default function ConfigPage() {
  const [configs, setConfigs] = useState({
    siteTitle: 'AI智能评测系统',
    pageHeader: 'AI智能评测',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  // Fetch configs function
  const fetchConfigs = useCallback(async () => {
    try {
      const res = await fetch('/api/config?t=' + Date.now())
      if (!res.ok) throw new Error('获取配置失败')
      const data = await res.json()
      setConfigs({
        siteTitle: data.siteTitle || 'AI智能评测系统',
        pageHeader: data.pageHeader || 'AI智能评测',
      })
    } catch (err) {
      console.error('获取配置失败:', err)
    }
  }, [])

  // Fetch configs and check auth on mount
  useEffect(() => {
    Promise.all([
      fetch('/api/config?t=' + Date.now()).then(r => r.json()),
      fetch('/api/user/profile').then(r => r.ok ? r.json() : null),
    ])
      .then(([configData, userData]) => {
        if (!userData || !userData.isAdmin) {
          router.push('/login')
          return
        }
        setConfigs({
          siteTitle: configData.siteTitle || 'AI智能评测系统',
          pageHeader: configData.pageHeader || 'AI智能评测',
        })
        setLoading(false)
      })
      .catch(() => {
        setError('加载失败')
        setLoading(false)
      })
  }, [router])

  const handleSave = async () => {
    setSaving(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configs: [
            { key: 'siteTitle', value: configs.siteTitle },
            { key: 'pageHeader', value: configs.pageHeader },
          ],
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || '保存失败')
      }

      // 重新加载配置确认保存成功
      await fetchConfigs()
      setMessage('保存成功！')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '保存失败，请重试')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Settings className="w-8 h-8" />
          系统设置
        </h1>
        <p className="text-gray-500 mt-2">配置网站标题和页面显示文本</p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.includes('成功')
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message}
        </div>
      )}

      <div className="space-y-6">
        {/* Site Title */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">网站标题</h2>
              <p className="text-sm text-gray-500">浏览器标签页和页面标题显示的名称</p>
            </div>
          </div>
          <input
            type="text"
            value={configs.siteTitle}
            onChange={(e) =>
              setConfigs((prev) => ({ ...prev, siteTitle: e.target.value }))
            }
            placeholder="AI智能评测系统"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Page Header */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Type className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">页面头部标题</h2>
              <p className="text-sm text-gray-500">用户登录后页面顶部显示的名称</p>
            </div>
          </div>
          <input
            type="text"
            value={configs.pageHeader}
            onChange={(e) =>
              setConfigs((prev) => ({ ...prev, pageHeader: e.target.value }))
            }
            placeholder="AI智能评测"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              保存设置
            </>
          )}
        </button>
      </div>

      {/* Preview */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-4">当前设置（从数据库读取）</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 w-24">网站标题：</span>
            <span className="text-sm font-medium">{configs.siteTitle || 'AI智能评测系统'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 w-24">页面头部：</span>
            <span className="text-sm font-medium">{configs.pageHeader || 'AI智能评测'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}