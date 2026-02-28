import { NextRequest } from 'next/server'
import { clearAuthCookie, getSession } from '@/lib/auth'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    // 清除认证 cookie
    await clearAuthCookie()
    return Response.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return Response.json(
      { error: '登出失败' },
      { status: 500 }
    )
  }
}
