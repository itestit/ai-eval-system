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

  return <UserPageClient users={users} />
}
