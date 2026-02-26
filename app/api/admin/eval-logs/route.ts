import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    await requireAdmin()
    
    const evalLogs = await prisma.evalLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: {
        user: {
          select: { email: true, name: true }
        },
        model: {
          select: { name: true, provider: true, modelName: true }
        }
      }
    })
    
    const formattedLogs = evalLogs.map(log => ({
      ...log,
      createdAt: log.createdAt.toISOString(),
      userEmail: log.user?.email || null,
      userName: log.user?.name || null,
      modelName: log.model?.name || null,
      modelProvider: log.model?.provider || null,
      modelFullName: log.model?.modelName || null,
    }))
    
    return Response.json({ logs: formattedLogs })
  } catch (error) {
    console.error('获取评测记录错误:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return Response.json({ error: '未登录' }, { status: 401 })
    }
    if (error instanceof Error && error.message.includes('Admin')) {
      return Response.json({ error: '无权限' }, { status: 403 })
    }
    return Response.json({ error: '获取失败' }, { status: 500 })
  }
}

// DELETE /api/admin/eval-logs - 删除评测记录（支持单条和批量）
export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin()
    
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const ids = searchParams.get('ids')
    
    // 批量删除
    if (ids) {
      const idList = ids.split(',')
      await prisma.evalLog.deleteMany({
        where: { id: { in: idList } }
      })
      return Response.json({ success: true, message: `已删除 ${idList.length} 条记录` })
    }
    
    // 单条删除
    if (id) {
      await prisma.evalLog.delete({
        where: { id }
      })
      return Response.json({ success: true, message: '删除成功' })
    }
    
    return Response.json({ error: '缺少记录ID' }, { status: 400 })
  } catch (error) {
    console.error('删除评测记录错误:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return Response.json({ error: '未登录' }, { status: 401 })
    }
    if (error instanceof Error && error.message.includes('Admin')) {
      return Response.json({ error: '无权限' }, { status: 403 })
    }
    return Response.json({ error: '删除失败' }, { status: 500 })
  }
}
