import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, createJWT } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const ip = req.ip ?? '127.0.0.1'
    console.log('Login attempt from:', ip)
    
    const { success } = await rateLimit(`login:${ip}`, 5, 60)
    
    if (!success) {
      console.log('Rate limit exceeded')
      return NextResponse.json(
        { error: '请求过于频繁，请稍后重试' },
        { status: 429 }
      )
    }

    const { email, password } = await req.json()
    console.log('Login email:', email)

    if (!email || !password) {
      return NextResponse.json(
        { error: '邮箱和密码不能为空' },
        { status: 400 }
      )
    }

    console.log('Looking up user...')
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      console.log('User not found')
      return NextResponse.json(
        { error: '邮箱或密码错误' },
        { status: 401 }
      )
    }

    console.log('User found:', user.id, 'Checking password...')
    
    let isValid
    try {
      isValid = await verifyPassword(password, user.passwordHash)
      console.log('Password check result:', isValid)
    } catch (pwError) {
      console.error('Password verification error:', pwError)
      return NextResponse.json(
        { error: '密码验证失败' },
        { status: 500 }
      )
    }

    if (!isValid) {
      console.log('Invalid password')
      return NextResponse.json(
        { error: '邮箱或密码错误' },
        { status: 401 }
      )
    }

    console.log('Creating JWT...')
    // Create JWT
    const token = await createJWT({
      userId: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    })
    console.log('JWT created')

    // Create response with cookie
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
      },
    })

    // Set cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    console.log('Cookie set, returning response')

    // Log login
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN',
          ip,
          userAgent: req.headers.get('user-agent') ?? undefined,
        },
      })
    } catch (logError) {
      console.error('Audit log error:', logError)
      // Don't fail login if audit log fails
    }

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: '登录失败，请稍后重试: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
}
