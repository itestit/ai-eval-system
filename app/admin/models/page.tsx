import { prisma } from '@/lib/prisma'
import ModelPageClient from './page.client'

export default async function ModelPage() {
  const models = await prisma.aIModel.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const formattedModels = models.map(m => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  }))

  return <ModelPageClient models={formattedModels} />
}
