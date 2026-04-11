import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { parseBody } from '@/lib/validation'

const UpdateConfigSchema = z.object({
  configs: z
    .array(
      z.object({
        key: z.string().trim().min(1, 'key 不能为空').max(100),
        value: z.string().max(10_000),
      })
    )
    .min(1, 'configs 不能为空')
    .max(100),
})

// GET /api/admin/config - Get all system configs (admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const configs = await prisma.systemConfig.findMany()
    
    // Add cache headers to prevent caching
    const response = NextResponse.json({ configs })
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    return response
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
  try {
    const session = await getSession()
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = await parseBody(req, UpdateConfigSchema)
    if (!parsed.ok) return parsed.response
    const { configs } = parsed.data

    // Upsert all configs
    await Promise.all(
      configs.map(({ key, value }: { key: string; value: string }) =>
        prisma.systemConfig.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        })
      )
    )

    // 使页面缓存立即失效
    revalidateTag('system-config')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update configs:', error)
    return NextResponse.json(
      { error: 'Failed to update configs' },
      { status: 500 }
    )
  }
}