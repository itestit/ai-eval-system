import { prisma } from '@/lib/prisma'
import PromptPageClient from './page.client'

export default async function PromptPage() {
  const [prompts, files, models] = await Promise.all([
    prisma.promptTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    }),
    prisma.knowledgeFile.findMany({
      orderBy: { createdAt: 'desc' },
    }),
    prisma.aIModel.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    }),
  ])

  return <PromptPageClient prompts={prompts} files={files} models={models} />
}
