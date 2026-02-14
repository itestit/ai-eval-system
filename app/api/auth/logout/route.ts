import { NextRequest } from 'next/server'
import { clearAuthCookie } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    
    if (session) {
      await prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: 'LOGOUT',
          ip: req.ip ?? undefined,
          userAgent: req.headers.get('user-agent') ?? undefined,
        },
      })
    }

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
