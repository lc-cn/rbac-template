import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getTenantCurrentSummaryForMember } from '@/lib/data-access'
import { redirectPathWhenMissingCurrentTenant } from '@/lib/organizations-current-redirect'
import { CurrentOrganizationView } from '@/components/organizations/current-organization-view'

export const dynamic = 'force-dynamic'

export default async function CurrentOrganizationPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=%2Forganizations%2Fcurrent')
  }
  const tid = session.currentTenantId ?? null
  if (!tid) {
    redirect(redirectPathWhenMissingCurrentTenant(!!session.isPlatformAdmin))
  }
  const summary = await getTenantCurrentSummaryForMember(session.user.id, tid)
  if (!summary) {
    notFound()
  }
  return <CurrentOrganizationView name={summary.name} slug={summary.slug} lifecycle={summary.lifecycle} currentUserId={session.user.id} />
}
