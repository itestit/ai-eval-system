import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, verifyPassword, createJWT, setAuthCookie } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const ip = req.ip ?? '127.0.0.1'
    const { success } = await rateLimit(`login:${ip}`, 5, 60)
    
    if (!success) {
      return Response.json(
        { error: '请求过于频繁，请稍后再试' },
        { status: 429 }
      )
    }

    const { email, password } = await req.json()

    if (!email || !password) {
      return Response.json(
        { error: '邮箱和密码不能为空' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      return Response.json(
        { error: '邮箱或密码错误' },
        { status: 401 }
      )
    }

    const isValid = await verifyPassword(password, user.passwordHash)

    if (!isValid) {
      return Response.json(
        { error: '邮箱或密码错误' },
        { status: 401 }
      )
    }

    // Create JWT and set cookie
    const token = await createJWT({
      userId: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    })

    await setAuthCookie(token)

    // Log login
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
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
    console.error('Login error:', error)
    return Response.json(
      { error: '登录失败，请稍后重试' },
      { status: 500 }
    )
  }
}
