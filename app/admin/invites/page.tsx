import { prisma } from '@/lib/prisma'
import InviteCodePageClient from './page.client'

export default async function InviteCodePage() {
  const codes = await prisma.inviteCode.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return <InviteCodePageClient codes={codes} />
}
