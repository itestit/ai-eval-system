import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function generateRandomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function GET() {
  try {
    await requireAdmin()
    
    const codes = await prisma.inviteCode.findMany({
      orderBy: { createdAt: 'desc' },
    })
    
    return Response.json({ codes })
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
    
    const { count = 1, customCode } = await req.json()
    
    if (customCode) {
      // Generate single custom code
      const existing = await prisma.inviteCode.findUnique({
        where: { code: customCode.toUpperCase() },
      })
      
      if (existing) {
        return Response.json({ error: '邀请码已存在' }, { status: 400 })
      }
      
      const code = await prisma.inviteCode.create({
        data: { code: customCode.toUpperCase() },
      })
      
      return Response.json({ codes: [code] })
    }
    
    // Generate random codes
    const codes: string[] = []
    while (codes.length < Math.min(count, 100)) {
      const code = generateRandomCode()
      const existing = await prisma.inviteCode.findUnique({
        where: { code },
      })
      if (!existing) {
        codes.push(code)
      }
    }
    
    const created = await prisma.$transaction(
      codes.map(code => 
        prisma.inviteCode.create({
          data: { code },
        })
      )
    )
    
    return Response.json({ codes: created })
  } catch (error) {
    console.error('Generate invite codes error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return Response.json({ error: '未登录' }, { status: 401 })
    }
    if (error instanceof Error && error.message.includes('Admin')) {
      return Response.json({ error: '无权限' }, { status: 403 })
    }
    return Response.json({ error: '生成失败' }, { status: 500 })
  }
}
