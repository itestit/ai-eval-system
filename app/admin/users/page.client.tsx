'use client'

import { useState } from 'react'
import { Search, Plus, Minus, Ban, CheckCircle, UserCheck, KeyRound, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface User {
  id: string
  email: string
  name: string | null
  remainingEvals: number
  isAdmin: boolean
  createdAt: string
  inviteCode: { code: string } | null
}

interface UserPageProps {
  users: User[]
}

export default function UserPageClient({ users }: UserPageProps) {
  const [userList, setUserList] = useState(users)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [addCount, setAddCount] = useState(10)
  const [isUpdating, setIsUpdating] = useState(false)
  
  // 密码重置相关状态
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [resetMessage, setResetMessage] = useState('')

  const filteredUsers = userList.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.name?.toLowerCase().includes(search.toLowerCase())
  )

  const updateEvals = async (userId: string, delta: number) => {
    setIsUpdating(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'addEvals', delta }),
      })
      
      if (res.ok) {
        setUserList(prev => prev.map(u => 
          u.id === userId 
            ? { ...u, remainingEvals: Math.max(0, u.remainingEvals + delta) }
            : u
        ))
        setSelectedUser(null)
      }
    } finally {
      setIsUpdating(false)
    }
  }

  const toggleAdmin = async (userId: string, isAdmin: boolean) => {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action: 'toggleAdmin', isAdmin: !isAdmin }),
    })
    
    if (res.ok) {
      setUserList(prev => prev.map(u => 
        u.id === userId ? { ...u, isAdmin: !isAdmin } : u
      ))
    }
  }

  // 重置密码
  const resetPassword = async () => {
    if (!resetPasswordUser || !newPassword) return
    
    setIsResetting(true)
    setResetMessage('')
    
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: resetPasswordUser.id, 
          action: 'resetPassword', 
          newPassword 
        }),
      })
      
      if (res.ok) {
        setResetMessage('密码重置成功！')
        setTimeout(() => {
          setResetPasswordUser(null)
          setNewPassword('')
          setResetMessage('')
        }, 1500)
      } else {
        const data = await res.json()
        setResetMessage(data.error || '重置失败')
      }
    } catch (error) {
      setResetMessage('重置失败，请重试')
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">用户管理</h1>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索用户..."
            className="pl-10 pr-4 py-2 rounded-lg border w-64"
          />
        </div>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium">用户</th>
              <th className="px-6 py-3 text-left text-sm font-medium">邀请码</th>
              <th className="px-6 py-3 text-left text-sm font-medium">剩余次数</th>
              <th className="px-6 py-3 text-left text-sm font-medium">注册时间</th>
              <th className="px-6 py-3 text-left text-sm font-medium">角色</th>
              <th className="px-6 py-3 text-right text-sm font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-muted/30">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium">{user.name || '未设置昵称'}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-sm">
                  {user.inviteCode?.code || '-'}
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "font-medium",
                    user.remainingEvals <= 0 ? "text-destructive" : "text-green-600"
                  )}>
                    {user.remainingEvals}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    user.isAdmin
                      ? "bg-purple-100 text-purple-700"
                      : "bg-gray-100 text-gray-600"
                  )}>
                    {user.isAdmin ? '管理员' : '普通用户'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="p-2 rounded-lg hover:bg-muted"
                      title="充值额度"
                    >
                      <Plus className="w-4 h-4 text-green-600" />
                    </button>
                    <button
                      onClick={() => setResetPasswordUser(user)}
                      className="p-2 rounded-lg hover:bg-muted"
                      title="重置密码"
                    >
                      <KeyRound className="w-4 h-4 text-orange-500" />
                    </button>
                    <button
                      onClick={() => toggleAdmin(user.id, user.isAdmin)}
                      className="p-2 rounded-lg hover:bg-muted"
                      title={user.isAdmin ? '取消管理员' : '设为管理员'}
                    >
                      {user.isAdmin ? (
                        <Ban className="w-4 h-4 text-destructive" />
                      ) : (
                        <UserCheck className="w-4 h-4 text-blue-500" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                  未找到匹配的用户
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Credits Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">调整用户额度</h3>
            <p className="text-sm text-muted-foreground mb-4">
              用户: {selectedUser.email}<br/>
              当前额度: <span className="font-medium">{selectedUser.remainingEvals}</span>
            </p>
            
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setAddCount(Math.max(-selectedUser.remainingEvals, addCount - 10))}
                className="p-2 rounded-lg border hover:bg-muted"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                value={addCount}
                onChange={(e) => setAddCount(parseInt(e.target.value) || 0)}
                className="flex-1 text-center py-2 rounded-lg border font-medium"
              />
              <button
                onClick={() => setAddCount(addCount + 10)}
                className="p-2 rounded-lg border hover:bg-muted"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedUser(null)}
                className="flex-1 py-2.5 rounded-lg border hover:bg-muted"
              >
                取消
              </button>
              <button
                onClick={() => updateEvals(selectedUser.id, addCount)}
                disabled={isUpdating}
                className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isUpdating ? '处理中...' : '确认'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPasswordUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">重置用户密码</h3>
            <p className="text-sm text-muted-foreground mb-4">
              用户: {resetPasswordUser.email}
            </p>
            
            {resetMessage && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${
                resetMessage.includes('成功') 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {resetMessage}
              </div>
            )}
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">新密码</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="请输入新密码"
                  className="w-full px-4 py-2 pr-10 rounded-lg border font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setResetPasswordUser(null)
                  setNewPassword('')
                  setResetMessage('')
                }}
                className="flex-1 py-2.5 rounded-lg border hover:bg-muted"
              >
                取消
              </button>
              <button
                onClick={resetPassword}
                disabled={isResetting || !newPassword}
                className="flex-1 py-2.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {isResetting ? '重置中...' : '重置密码'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
