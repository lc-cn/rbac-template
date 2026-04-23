import { notFound } from 'next/navigation'
import { getApplicationById } from '@/lib/data-access'
import { getOAuth2ClientAdminById } from '@/lib/oauth2/client-admin'
import { ApplicationIdpFormPage } from '../../application-idp-form-page'

type PageProps = { params: Promise<{ id: string }> }

export default async function ApplicationIdpPage({ params }: PageProps) {
  const { id } = await params
  const app = await getApplicationById(id)
  if (!app) notFound()

  const dto = await getOAuth2ClientAdminById(id)
  const mode = dto ? 'edit' : 'create'

  return <ApplicationIdpFormPage applicationId={id} mode={mode} initialRow={dto} />
}
