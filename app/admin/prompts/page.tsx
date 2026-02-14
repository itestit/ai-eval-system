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

  const formattedPrompts = prompts.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }))

  const formattedFiles = files.map(f => ({
    ...f,
    createdAt: f.createdAt.toISOString(),
  }))

  return <PromptPageClient prompts={formattedPrompts} files={formattedFiles} models={models} />
}
