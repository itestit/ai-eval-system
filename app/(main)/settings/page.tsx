import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import SettingsPageClient from './page.client'

export default async function SettingsPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  return <SettingsPageClient user={user} />
}
