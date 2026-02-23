import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/user/sections - 获取当前用户可访问的板块
export async function GET() {
  try {
    const session = await requireAuth()
    
    // 获取用户可访问的板块
    const sections = await prisma.section.findMany({
      where: {
        isActive: true,
        OR: [
          { visibility: 'ALL' },
          {
            visibility: 'SPECIFIC',
            accessUsers: {
              some: { userId: session.userId }
            }
          }
        ]
      },
      orderBy: { sortOrder: 'asc' },
      include: {
        promptTemplate: {
          select: { 
            id: true, 
            name: true, 
            type: true,
            systemPrompt: true,
            attachedFiles: true
          }
        }
      }
    })

    return Response.json({ sections })
  } catch (error) {
    console.error('获取板块失败:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return Response.json({ error: '未登录' }, { status: 401 })
    }
    return Response.json({ error: '获取失败' }, { status: 500 })
  }
}