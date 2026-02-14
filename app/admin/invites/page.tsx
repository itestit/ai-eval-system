import { prisma } from '@/lib/prisma'
import InviteCodePageClient from './page.client'

export default async function InviteCodePage() {
  const codes = await prisma.inviteCode.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const formattedCodes = codes.map(c => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    usedAt: c.usedAt?.toISOString() || null,
  }))

  return <InviteCodePageClient codes={formattedCodes} />
}
