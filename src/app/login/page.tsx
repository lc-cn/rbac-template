import { Suspense } from 'react'
import { LoginForm } from '@/app/login/login-form'

function LoginFallback() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center text-sm text-muted-foreground">…</div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  )
}
