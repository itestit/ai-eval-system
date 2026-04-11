import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseBody } from '@/lib/validation'

const CreateModelSchema = z.object({
  name: z.string().trim().min(1, '名称不能为空').max(100),
  provider: z.string().trim().min(1).max(50),
  baseUrl: z
    .string()
    .trim()
    .max(500)
    .url('baseUrl 必须是合法 URL')
    .optional()
    .or(z.literal('').transform(() => undefined))
    .nullish(),
  apiKey: z.string().min(1, 'apiKey 不能为空').max(500),
  modelName: z.string().trim().min(1).max(200),
})

const UpdateModelSchema = z.object({
  id: z.string().min(1, '缺少ID'),
  name: z.string().trim().min(1).max(100).optional(),
  provider: z.string().trim().min(1).max(50).optional(),
  baseUrl: z
    .string()
    .trim()
    .max(500)
    .url('baseUrl 必须是合法 URL')
    .or(z.literal(''))
    .nullish(),
  apiKey: z.string().max(500).optional(),
  modelName: z.string().trim().min(1).max(200).optional(),
  isActive: z.boolean().optional(),
})


export async function GET() {
  try {
    await requireAdmin()
    
    const models = await prisma.aIModel.findMany({
      orderBy: { createdAt: 'desc' },
    })
    
    return Response.json({ models })
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

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()

    const parsed = await parseBody(req, CreateModelSchema)
    if (!parsed.ok) return parsed.response
    const { name, provider, baseUrl, apiKey, modelName } = parsed.data

    const model = await prisma.aIModel.create({
      data: {
        name,
        provider,
        baseUrl: baseUrl || null,
        apiKey,
        modelName,
        isActive: true,
      },
    })
    
    return Response.json({ model })
  } catch (error) {
    console.error('Create model error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return Response.json({ error: '未登录' }, { status: 401 })
    }
    if (error instanceof Error && error.message.includes('Admin')) {
      return Response.json({ error: '无权限' }, { status: 403 })
    }
    return Response.json({ error: '创建失败' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin()

    const parsed = await parseBody(req, UpdateModelSchema)
    if (!parsed.ok) return parsed.response
    const { id, name, provider, baseUrl, apiKey, modelName, isActive } = parsed.data

    // Build update data dynamically
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (provider !== undefined) updateData.provider = provider
    if (baseUrl !== undefined) updateData.baseUrl = baseUrl || null
    if (apiKey !== undefined && apiKey !== '') updateData.apiKey = apiKey
    if (modelName !== undefined) updateData.modelName = modelName
    if (isActive !== undefined) updateData.isActive = isActive
    
    const model = await prisma.aIModel.update({
      where: { id },
      data: updateData,
    })
    
    return Response.json({ model })
  } catch (error) {
    console.error('Update model error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return Response.json({ error: '未登录' }, { status: 401 })
    }
    if (error instanceof Error && error.message.includes('Admin')) {
      return Response.json({ error: '无权限' }, { status: 403 })
    }
    return Response.json({ error: '更新失败' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin()
    
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return Response.json({ error: '缺少ID' }, { status: 400 })
    }
    
    await prisma.aIModel.delete({
      where: { id },
    })
    
    return Response.json({ success: true })
  } catch (error) {
    console.error('Delete model error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return Response.json({ error: '未登录' }, { status: 401 })
    }
    if (error instanceof Error && error.message.includes('Admin')) {
      return Response.json({ error: '无权限' }, { status: 403 })
    }
    return Response.json({ error: '删除失败' }, { status: 500 })
  }
}
