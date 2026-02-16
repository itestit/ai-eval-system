import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/config - Get public system configs
export async function GET() {
  try {
    const configs = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: ['siteTitle', 'pageHeader'],
        },
      },
    })

    const configMap: Record<string, string> = {
      siteTitle: 'AI智能评测系统',
      pageHeader: 'AI智能评测',
    }

    configs.forEach((config) => {
      configMap[config.key] = config.value
    })

    return NextResponse.json(configMap)
  } catch (error) {
    console.error('Failed to get configs:', error)
    // Return defaults on error
    return NextResponse.json({
      siteTitle: 'AI智能评测系统',
      pageHeader: 'AI智能评测',
    })
  }
}