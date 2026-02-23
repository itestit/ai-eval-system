import { prisma } from '@/lib/prisma'
import EvalLogsPageClient from './page.client'

export default async function EvalLogsPage() {
  const evalLogs = await prisma.evalLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 500,
    include: {
      user: {
        select: { email: true, name: true }
      },
      model: {
        select: { name: true, provider: true, modelName: true }
      }
    }
  })

  const formattedLogs = evalLogs.map(log => ({
    ...log,
    createdAt: log.createdAt.toISOString(),
    userEmail: log.user?.email || null,
    userName: log.user?.name || null,
    modelName: log.model?.name || null,
    modelProvider: log.model?.provider || null,
    modelFullName: log.model?.modelName || null,
  }))

  return <EvalLogsPageClient logs={formattedLogs} />
}
