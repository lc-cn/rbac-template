import { notFound } from 'next/navigation'
import { getOAuth2ClientAdminById } from '@/lib/oauth2/client-admin'
import { OAuth2ClientFormPage } from '../../oauth2-client-form-page'

type PageProps = { params: Promise<{ id: string }> }

export default async function EditOAuth2ClientPage({ params }: PageProps) {
  const { id } = await params
  const row = await getOAuth2ClientAdminById(id)
  if (!row) notFound()
  return <OAuth2ClientFormPage mode="edit" initialRow={row} />
}
