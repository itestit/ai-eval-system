import { prisma } from '@/lib/prisma'
import SectionsPageClient from './page.client'

export default async function SectionsPage() {
  const [sections, promptTemplates, users] = await Promise.all([
    prisma.section.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        promptTemplate: {
          select: { id: true, name: true }
        },
        accessUsers: {
          select: { userId: true }
        }
      }
    }),
    prisma.promptTemplate.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, type: true }
    }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, name: true }
    })
  ])

  const formattedSections = sections.map(s => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString()
  }))

  return <SectionsPageClient 
    sections={formattedSections} 
    promptTemplates={promptTemplates}
    users={users}
  />
}