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

    // Add cache headers to prevent caching
    const response = NextResponse.json(configMap)
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    return response
  } catch (error) {
    console.error('Failed to get configs:', error)
    // Return defaults on error
    const response = NextResponse.json({
      siteTitle: 'AI智能评测系统',
      pageHeader: 'AI智能评测',
    })
    response.headers.set('Cache-Control', 'no-store')
    return response
  }
}