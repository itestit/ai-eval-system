import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'edge'

// GET /api/user/profile - Get current user profile
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        remainingEvals: true,
      },
    })

    if (!user) {
      return Response.json({ error: '用户不存在' }, { status: 404 })
    }

    return Response.json(user)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return Response.json({ error: '未登录' }, { status: 401 })
    }
    return Response.json({ error: '获取失败' }, { status: 500 })
  }
}

// PATCH /api/user/profile - Update user profile
export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth()
    const { name } = await req.json()

    await prisma.user.update({
      where: { id: session.userId },
      data: { name },
    })

    return Response.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return Response.json({ error: '未登录' }, { status: 401 })
    }
    return Response.json({ error: '更新失败' }, { status: 500 })
  }
}
