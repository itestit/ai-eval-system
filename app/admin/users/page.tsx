import { prisma } from '@/lib/prisma'
import UserPageClient from './page.client'

export default async function UserPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      inviteCode: {
        select: { code: true }
      }
    }
  })

  const formattedUsers = users.map(u => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    inviteCode: u.inviteCode ? { code: u.inviteCode.code } : null,
  }))

  return <UserPageClient users={formattedUsers} />
}
