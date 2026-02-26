import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import EvalPageClient from './page.client'

export default async function EvalPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  // 获取页面配置
  const configs = await prisma.systemConfig.findMany({
    where: {
      key: {
        in: ['pageHeader', 'pageSubHeader']
      }
    }
  })
  
  const configMap: Record<string, string> = {}
  configs.forEach(c => {
    configMap[c.key] = c.value
  })

  return <EvalPageClient 
    user={user} 
    pageHeader={configMap.pageHeader || 'AI智能评测'}
    pageSubHeader={configMap.pageSubHeader || 'AI 智能评测'}
  />
}
