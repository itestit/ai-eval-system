import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const ip = req.ip ?? '127.0.0.1'
    const { success } = await rateLimit(`verify-invite:${ip}`, 10, 60)
    
    if (!success) {
      return Response.json(
        { error: '请求过于频繁' },
        { status: 429 }
      )
    }

    const { code } = await req.json()

    if (!code) {
      return Response.json(
        { error: '邀请码不能为空' },
        { status: 400 }
      )
    }

    const inviteCode = await prisma.inviteCode.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (!inviteCode) {
      return Response.json(
        { error: '邀请码不存在' },
        { status: 400 }
      )
    }

    if (inviteCode.status !== 'UNUSED') {
      return Response.json(
        { error: '邀请码已被使用' },
        { status: 400 }
      )
    }

    return Response.json({ valid: true })
  } catch (error) {
    console.error('Verify invite error:', error)
    return Response.json(
      { error: '验证失败' },
      { status: 500 }
    )
  }
}
