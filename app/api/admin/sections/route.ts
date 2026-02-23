import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/sections - 获取所有板块
export async function GET() {
  try {
    await requireAdmin()

    const sections = await prisma.section.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        promptTemplate: {
          select: { id: true, name: true }
        },
        accessUsers: {
          select: { userId: true }
        }
      }
    })

    return Response.json({ sections })
  } catch (error) {
    console.error('获取板块失败:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return Response.json({ error: '未登录' }, { status: 401 })
    }
    if (error instanceof Error && error.message.includes('Admin')) {
      return Response.json({ error: '无权限' }, { status: 403 })
    }
    return Response.json({ error: '获取失败' }, { status: 500 })
  }
}

// POST /api/admin/sections - 创建板块
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()

    const { name, description, promptTemplateId, visibility, accessUserIds, sortOrder } = await req.json()

    if (!name) {
      return Response.json({ error: '板块名称不能为空' }, { status: 400 })
    }

    // 创建板块
    const section = await prisma.section.create({
      data: {
        name,
        description,
        promptTemplateId,
        visibility: visibility || 'ALL',
        sortOrder: sortOrder || 0,
        ...(visibility === 'SPECIFIC' && accessUserIds?.length > 0 ? {
          accessUsers: {
            create: accessUserIds.map((userId: string) => ({ userId }))
          }
        } : {})
      },
      include: {
        promptTemplate: {
          select: { id: true, name: true }
        },
        accessUsers: {
          select: { userId: true }
        }
      }
    })

    return Response.json({ section })
  } catch (error) {
    console.error('创建板块失败:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return Response.json({ error: '未登录' }, { status: 401 })
    }
    if (error instanceof Error && error.message.includes('Admin')) {
      return Response.json({ error: '无权限' }, { status: 403 })
    }
    return Response.json({ error: '创建失败' }, { status: 500 })
  }
}

// PATCH /api/admin/sections - 更新板块
export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin()

    const { id, name, description, promptTemplateId, visibility, accessUserIds, isActive, sortOrder } = await req.json()

    if (!id) {
      return Response.json({ error: '板块ID不能为空' }, { status: 400 })
    }

    // 先删除现有的访问权限（如果有）
    if (visibility === 'SPECIFIC') {
      await prisma.sectionAccess.deleteMany({
        where: { sectionId: id }
      })
    }

    // 更新板块
    const section = await prisma.section.update({
      where: { id },
      data: {
        name,
        description,
        promptTemplateId,
        visibility,
        isActive,
        sortOrder,
        ...(visibility === 'SPECIFIC' && accessUserIds?.length > 0 ? {
          accessUsers: {
            create: accessUserIds.map((userId: string) => ({ userId }))
          }
        } : {})
      },
      include: {
        promptTemplate: {
          select: { id: true, name: true }
        },
        accessUsers: {
          select: { userId: true }
        }
      }
    })

    return Response.json({ section })
  } catch (error) {
    console.error('更新板块失败:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return Response.json({ error: '未登录' }, { status: 401 })
    }
    if (error instanceof Error && error.message.includes('Admin')) {
      return Response.json({ error: '无权限' }, { status: 403 })
    }
    return Response.json({ error: '更新失败' }, { status: 500 })
  }
}

// DELETE /api/admin/sections - 删除板块
export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return Response.json({ error: '板块ID不能为空' }, { status: 400 })
    }

    await prisma.section.delete({
      where: { id }
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('删除板块失败:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return Response.json({ error: '未登录' }, { status: 401 })
    }
    if (error instanceof Error && error.message.includes('Admin')) {
      return Response.json({ error: '无权限' }, { status: 403 })
    }
    return Response.json({ error: '删除失败' }, { status: 500 })
  }
}