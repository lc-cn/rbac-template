import { Suspense } from 'react'
import { LoginForm } from '@/app/login/login-form'

function LoginFallback() {
  return (
    <div className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-center gap-3 px-4">
      <div className="h-10 w-10 animate-pulse rounded-2xl bg-muted" aria-hidden />
      <p className="text-sm text-muted-foreground">…</p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="relative isolate min-h-[100dvh] overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-8%,hsl(var(--primary)/0.14),transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(165deg,hsl(var(--muted)/0.35)_0%,transparent_45%,hsl(var(--muted)/0.2)_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-primary/[0.06] blur-3xl dark:bg-primary/[0.09]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-primary/[0.05] blur-3xl dark:bg-primary/[0.08]"
      />
      <Suspense fallback={<LoginFallback />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
