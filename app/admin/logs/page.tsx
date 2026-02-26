import { prisma } from '@/lib/prisma'
import LogPageClient from './page.client'

export default async function LogPage() {
  try {
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

    return <LogPageClient logs={formattedLogs} />
  } catch (error) {
    console.error('LogPage error:', error)
    // Return empty logs on error so the page still renders
    return <LogPageClient logs={[]} />
  }
}
