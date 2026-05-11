import { ProfilePageClient, type ProfileTab } from './profile-page-client'

const PROFILE_TABS: readonly ProfileTab[] = ['general', 'password', 'security', 'danger']

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const sp = await searchParams
  const raw = sp.tab
  const initialTab = PROFILE_TABS.includes(raw as ProfileTab) ? (raw as ProfileTab) : undefined
  return <ProfilePageClient initialTab={initialTab} />
}
