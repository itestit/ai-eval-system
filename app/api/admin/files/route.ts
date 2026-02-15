import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { put, del } from '@vercel/blob'


export async function GET() {
  try {
    await requireAdmin()
    
    const files = await prisma.knowledgeFile.findMany({
      orderBy: { createdAt: 'desc' },
    })
    
    return Response.json({ files })
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
    
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return Response.json({ error: '没有文件' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['text/plain', 'application/pdf']
    if (!allowedTypes.includes(file.type) && 
        !file.name.endsWith('.txt') && 
        !file.name.endsWith('.pdf')) {
      return Response.json({ error: '仅支持 .txt 和 .pdf 文件' }, { status: 400 })
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return Response.json({ error: '文件大小不能超过 10MB' }, { status: 400 })
    }

    // Upload to Vercel Blob
    const blob = await put(file.name, file, {
      access: 'public',
    })

    // Read file content for text files
    let content: string | null = null
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      content = await file.text()
    }

    // Save to database
    const knowledgeFile = await prisma.knowledgeFile.create({
      data: {
        name: file.name,
        blobUrl: blob.url,
        blobKey: blob.pathname,
        size: file.size,
        type: file.type || 'application/octet-stream',
        content,
      },
    })

    return Response.json({ file: knowledgeFile })
  } catch (error) {
    console.error('Upload file error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return Response.json({ error: '未登录' }, { status: 401 })
    }
    if (error instanceof Error && error.message.includes('Admin')) {
      return Response.json({ error: '无权限' }, { status: 403 })
    }
    return Response.json({ error: '上传失败' }, { status: 500 })
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

    const file = await prisma.knowledgeFile.findUnique({
      where: { id },
    })

    if (!file) {
      return Response.json({ error: '文件不存在' }, { status: 404 })
    }

    // Delete from Vercel Blob
    await del(file.blobKey)

    // Delete from database
    await prisma.knowledgeFile.delete({
      where: { id },
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('Delete file error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return Response.json({ error: '未登录' }, { status: 401 })
    }
    if (error instanceof Error && error.message.includes('Admin')) {
      return Response.json({ error: '无权限' }, { status: 403 })
    }
    return Response.json({ error: '删除失败' }, { status: 500 })
  }
}
