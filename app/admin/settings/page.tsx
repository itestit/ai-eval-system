import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ConfigPageClient from './page.client'

export default async function ConfigPage() {
  const user = await getCurrentUser()
  
  if (!user || !user.isAdmin) {
    redirect('/login')
  }

  // Get current configs
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

  return <ConfigPageClient initialConfigs={configMap} />
}