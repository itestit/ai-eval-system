import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'edge'

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
