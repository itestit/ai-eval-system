import { prisma } from '@/lib/prisma'
import ModelPageClient from './page.client'

export default async function ModelPage() {
  const models = await prisma.aIModel.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return <ModelPageClient models={models} />
}
