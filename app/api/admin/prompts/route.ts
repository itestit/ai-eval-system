import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'edge'

export async function GET() {
  try {
    await requireAdmin()
    
    const prompts = await prisma.promptTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    })
    
    return Response.json({ prompts })
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
    
    const { name, type, systemPrompt } = await req.json()
    
    const prompt = await prisma.promptTemplate.create({
      data: {
        name,
        type,
        systemPrompt: systemPrompt || '请对以下文本进行评测：\n\n{{user_input}}',
        attachedFiles: [],
      },
    })
    
    return Response.json({ prompt })
  } catch (error) {
    console.error('Create prompt error:', error)
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
    
    const { id, name, type, systemPrompt, attachedFiles, modelId } = await req.json()
    
    // Extract file references from prompt
    const fileRefs = systemPrompt.match(/@([\w.-]+\.\w+)/g) || []
    const fileNames = fileRefs.map((ref: string) => ref.slice(1))
    
    // Find file IDs
    const files = await prisma.knowledgeFile.findMany({
      where: { name: { in: fileNames } },
    })
    
    const fileIds = files.map(f => f.id)
    
    await prisma.promptTemplate.update({
      where: { id },
      data: {
        name,
        type,
        systemPrompt,
        attachedFiles: fileIds,
        modelId: modelId || null,
      },
    })
    
    return Response.json({ success: true })
  } catch (error) {
    console.error('Update prompt error:', error)
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
    
    await prisma.promptTemplate.delete({
      where: { id },
    })
    
    return Response.json({ success: true })
  } catch (error) {
    console.error('Delete prompt error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return Response.json({ error: '未登录' }, { status: 401 })
    }
    if (error instanceof Error && error.message.includes('Admin')) {
      return Response.json({ error: '无权限' }, { status: 403 })
    }
    return Response.json({ error: '删除失败' }, { status: 500 })
  }
}
