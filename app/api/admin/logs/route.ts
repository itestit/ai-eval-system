import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// GET /api/admin/logs - Get all audit logs (admin only)
export async function GET() {
  try {
    const session = await getSession()
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 1000,
      include: {
        user: {
          select: { email: true }
        }
      }
    })

    const formattedLogs = logs.map(log => ({
      ...log,
      createdAt: log.createdAt.toISOString(),
      userEmail: log.user?.email || null
    }))

    return NextResponse.json({ logs: formattedLogs })
  } catch (error) {
    console.error('Failed to get logs:', error)
    return NextResponse.json(
      { error: 'Failed to get logs' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/logs - Delete audit logs (admin only)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const ids = searchParams.get('ids')

    if (!ids) {
      return NextResponse.json({ error: 'Missing ids parameter' }, { status: 400 })
    }

    const logIds = ids.split(',')

    // Delete logs
    await prisma.auditLog.deleteMany({
      where: {
        id: {
          in: logIds,
        },
      },
    })

    return NextResponse.json({ success: true, deletedCount: logIds.length })
  } catch (error) {
    console.error('Failed to delete logs:', error)
    return NextResponse.json(
      { error: 'Failed to delete logs' },
      { status: 500 }
    )
  }
}