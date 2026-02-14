import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import EvalPageClient from './page.client'

export default async function EvalPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  return <EvalPageClient user={user} />
}
