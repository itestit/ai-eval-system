import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'edge'

export async function GET() {
  try {
    await requireAdmin()
    
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        inviteCode: { select: { code: true } }
      }
    })
    
    return Response.json({ users })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return Response.json({ error: '未登录' }, { status: 401 })
    }
    if (error instanceof Error && error.message.includes('Admin')) {
      return Response.json({ error: '无权限' }, { status: 403 })
    }
    return Response.json({ error: '获取失败' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin()
    
    const { userId, action, delta, isAdmin } = await req.json()
    
    if (action === 'addEvals') {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { 
          remainingEvals: { 
            increment: delta 
          } 
        },
      })
      
      await prisma.auditLog.create({
        data: {
          action: 'ADMIN_ADD_EVALS',
          metadata: { userId, delta, newBalance: user.remainingEvals },
        },
      })
      
      return Response.json({ success: true, remainingEvals: user.remainingEvals })
    }
    
    if (action === 'toggleAdmin') {
      await prisma.user.update({
        where: { id: userId },
        data: { isAdmin },
      })
      
      return Response.json({ success: true, isAdmin })
    }
    
    return Response.json({ error: '未知操作' }, { status: 400 })
  } catch (error) {
    console.error('Update user error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return Response.json({ error: '未登录' }, { status: 401 })
    }
    if (error instanceof Error && error.message.includes('Admin')) {
      return Response.json({ error: '无权限' }, { status: 403 })
    }
    return Response.json({ error: '更新失败' }, { status: 500 })
  }
}
