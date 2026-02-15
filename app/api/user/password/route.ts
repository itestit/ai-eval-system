import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, verifyPassword, hashPassword } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth()
    const { currentPassword, newPassword } = await req.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: '缺少必要信息' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: '密码至少需要6位' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    })

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    const isValid = await verifyPassword(currentPassword, user.passwordHash)

    if (!isValid) {
      return NextResponse.json({ error: '当前密码错误' }, { status: 400 })
    }

    const newHash = await hashPassword(newPassword)

    await prisma.user.update({
      where: { id: session.userId },
      data: { passwordHash: newHash },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'PASSWORD_CHANGE',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }
    return NextResponse.json({ error: '修改失败' }, { status: 500 })
  }
}
