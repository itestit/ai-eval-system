import { prisma } from '@/lib/prisma'
import FilePageClient from './page.client'

export default async function FilePage() {
  const files = await prisma.knowledgeFile.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const formattedFiles = files.map(f => ({
    ...f,
    createdAt: f.createdAt.toISOString(),
  }))

  return <FilePageClient files={formattedFiles} />
}
