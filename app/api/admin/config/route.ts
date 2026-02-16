import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

// GET /api/admin/config - Get all system configs (admin only)
export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const configs = await prisma.systemConfig.findMany()
    return NextResponse.json({ configs })
  } catch (error) {
    console.error('Failed to get configs:', error)
    return NextResponse.json(
      { error: 'Failed to get configs' },
      { status: 500 }
    )
  }
}

// POST /api/admin/config - Update system configs (admin only)
export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { configs } = await req.json()

    // configs should be an array of { key, value }
    if (!Array.isArray(configs)) {
      return NextResponse.json(
        { error: 'Invalid config format' },
        { status: 400 }
      )
    }

    // Upsert all configs
    await Promise.all(
      configs.map(({ key, value }) =>
        prisma.systemConfig.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update configs:', error)
    return NextResponse.json(
      { error: 'Failed to update configs' },
      { status: 500 }
    )
  }
}