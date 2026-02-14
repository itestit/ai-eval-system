'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Mail, Lock, Save, LogOut, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UserSettings {
  id: string
  email: string
  name: string | null
  remainingEvals: number
}

interface SettingsPageProps {
  user: UserSettings
}

export default function SettingsPageClient({ user }: SettingsPageProps) {
  const router = useRouter()
  const [name, setName] = useState(user.name || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const updateProfile = async () => {
    setIsSaving(true)
    setError('')
    setMessage('')

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })

      if (res.ok) {
        setMessage('个人信息已更新')
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error || '更新失败')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const updatePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    if (newPassword.length < 6) {
      setError('密码至少需要6位')
      return
    }

    setIsSaving(true)
    setError('')
    setMessage('')

    try {
      const res = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      if (res.ok) {
        setMessage('密码已修改')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const data = await res.json()
        setError(data.error || '修改失败')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-muted/30 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">个人设置</h1>

        {message && (
          <div className="mb-6 p-4 rounded-lg bg-green-100 text-green-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-100 text-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="bg-card rounded-xl border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            个人信息
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">邮箱</label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">{user.email}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">昵称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="设置您的昵称"
                className="w-full px-3 py-2 rounded-lg border"
              />
            </div>

            <button
              onClick={updateProfile}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>

        <div className="bg-card rounded-xl border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            修改密码
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">当前密码</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">新密码</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">确认新密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border"
              />
            </div>

            <button
              onClick={updatePassword}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              {isSaving ? '修改中...' : '修改密码'}
            </button>
          </div>
        </div>

        <div className="bg-card rounded-xl border p-6">
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border text-destructive hover:bg-destructive/10 w-full justify-center"
          >
            <LogOut className="w-4 h-4" />
            退出登录
          </button>
        </div>
      </div>
    </div>
  )
}
