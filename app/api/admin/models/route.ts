import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'edge'

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
    
    const { name, provider, baseUrl, apiKey, modelName } = await req.json()
    
    if (!name || !apiKey || !modelName) {
      return Response.json({ error: '缺少必要字段' }, { status: 400 })
    }
    
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
    
    const { id, isActive } = await req.json()
    
    await prisma.aIModel.update({
      where: { id },
      data: { isActive },
    })
    
    return Response.json({ success: true })
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
