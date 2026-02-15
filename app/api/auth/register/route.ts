import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, createJWT, setAuthCookie } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const ip = req.ip ?? '127.0.0.1'
    const { success } = await rateLimit(`register:${ip}`, 3, 300)
    
    if (!success) {
      return Response.json(
        { error: '请求过于频繁，请稍后再试' },
        { status: 429 }
      )
    }

    const { email, password, name, inviteCode } = await req.json()

    if (!email || !password || !inviteCode) {
      return Response.json(
        { error: '缺少必要信息' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return Response.json(
        { error: '密码至少需要6位' },
        { status: 400 }
      )
    }

    // Verify invite code
    const code = await prisma.inviteCode.findUnique({
      where: { code: inviteCode.toUpperCase() },
    })

    if (!code || code.status !== 'UNUSED') {
      return Response.json(
        { error: '邀请码无效或已被使用' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return Response.json(
        { error: '该邮箱已被注册' },
        { status: 400 }
      )
    }

    // Create user and mark invite code as used
    const passwordHash = await hashPassword(password)

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          name: name || null,
          passwordHash,
          remainingEvals: 99,
          inviteCodeId: code.id,
        },
      })

      await tx.inviteCode.update({
        where: { id: code.id },
        data: {
          status: 'USED',
          usedAt: new Date(),
        },
      })

      return newUser
    })

    // Create JWT and set cookie
    const token = await createJWT({
      userId: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    })

    await setAuthCookie(token)

    // Log registration
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'REGISTER',
        ip,
        userAgent: req.headers.get('user-agent') ?? undefined,
      },
    })

    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
      },
    })
  } catch (error) {
    console.error('Register error:', error)
    return Response.json(
      { error: '注册失败，请稍后重试' },
      { status: 500 }
    )
  }
}
