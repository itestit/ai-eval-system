import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseBody } from '@/lib/validation'

// 板块字段的共享校验规则
const sectionFields = {
  name: z.string().trim().min(1, '板块名称不能为空').max(100, '板块名称过长'),
  description: z.string().max(500).nullish(),
  promptTemplateId: z.string().max(50).nullish(),
  visibility: z.enum(['ALL', 'SPECIFIC']).default('ALL'),
  accessUserIds: z.array(z.string()).max(1000).optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  isActive: z.boolean().optional(),
  inputLabel: z.string().max(100).nullish(),
  inputPlaceholder: z.string().max(500).nullish(),
  submitButtonText: z.string().max(50).nullish(),
  resultLabel: z.string().max(100).nullish(),
  emptyResultText: z.string().max(500).nullish(),
  loadingText: z.string().max(100).nullish(),
}

const CreateSectionSchema = z.object(sectionFields)
const UpdateSectionSchema = z.object({
  id: z.string().min(1, '板块ID不能为空'),
  ...sectionFields,
  name: sectionFields.name.optional(),
  visibility: z.enum(['ALL', 'SPECIFIC']).optional(),
})

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

    const parsed = await parseBody(req, CreateSectionSchema)
    if (!parsed.ok) return parsed.response
    const {
      name, description, promptTemplateId, visibility, accessUserIds, sortOrder, isActive,
      inputLabel, inputPlaceholder, submitButtonText, resultLabel, emptyResultText, loadingText
    } = parsed.data

    // 将空字符串/null 转换为 null
    const cleanPromptTemplateId = promptTemplateId || null

    // 创建板块
    const section = await prisma.section.create({
      data: {
        name,
        description,
        promptTemplateId: cleanPromptTemplateId,
        visibility: visibility || 'ALL',
        sortOrder: sortOrder || 0,
        isActive: isActive !== undefined ? isActive : true,
        // UI 配置字段
        inputLabel: inputLabel || undefined,
        inputPlaceholder: inputPlaceholder || undefined,
        submitButtonText: submitButtonText || undefined,
        resultLabel: resultLabel || undefined,
        emptyResultText: emptyResultText || undefined,
        loadingText: loadingText || undefined,
        ...(visibility === 'SPECIFIC' && accessUserIds && accessUserIds.length > 0 ? {
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
    return Response.json({ error: '创建失败', details: String(error) }, { status: 500 })
  }
}

// PATCH /api/admin/sections - 更新板块
export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin()

    const parsed = await parseBody(req, UpdateSectionSchema)
    if (!parsed.ok) return parsed.response
    const {
      id, name, description, promptTemplateId, visibility, accessUserIds, isActive, sortOrder,
      inputLabel, inputPlaceholder, submitButtonText, resultLabel, emptyResultText, loadingText
    } = parsed.data

    // 将空字符串/null 转换为 null
    const cleanPromptTemplateId = promptTemplateId || null

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
        promptTemplateId: cleanPromptTemplateId,
        visibility,
        isActive,
        sortOrder,
        // UI 配置字段 - 空字符串转为 null，undefined 则不更新
        inputLabel: inputLabel === '' ? null : inputLabel,
        inputPlaceholder: inputPlaceholder === '' ? null : inputPlaceholder,
        submitButtonText: submitButtonText === '' ? null : submitButtonText,
        resultLabel: resultLabel === '' ? null : resultLabel,
        emptyResultText: emptyResultText === '' ? null : emptyResultText,
        loadingText: loadingText === '' ? null : loadingText,
        ...(visibility === 'SPECIFIC' && accessUserIds && accessUserIds.length > 0 ? {
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
    return Response.json({ error: '更新失败', details: String(error) }, { status: 500 })
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