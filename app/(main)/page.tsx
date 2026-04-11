import { redirect } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import EvalPageClient from './page.client'

// 缓存页面配置：tag 'system-config' 会被 admin POST /api/admin/config 后的 revalidateTag 清掉
const getPageConfig = unstable_cache(
  async () => {
    const configs = await prisma.systemConfig.findMany({
      where: { key: { in: ['pageHeader', 'pageSubHeader'] } },
    })
    const map: Record<string, string> = {}
    configs.forEach((c) => {
      map[c.key] = c.value
    })
    return map
  },
  ['page-config-header'],
  { tags: ['system-config'], revalidate: 3600 }
)

export default async function EvalPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const configMap = await getPageConfig()

  return <EvalPageClient 
    user={user} 
    pageHeader={configMap.pageHeader || 'AI智能评测'}
    pageSubHeader={configMap.pageSubHeader || 'AI 智能评测'}
  />
}
