import { Suspense } from 'react'
import { LoginForm } from '@/app/login/login-form'

function LoginFallback() {
  return (
    <div className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-center gap-3 px-4">
      <div className="h-10 w-10 animate-pulse motion-reduce:animate-none rounded-2xl bg-muted" aria-hidden />
      <p className="text-sm text-muted-foreground">…</p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="relative isolate min-h-[100dvh] overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-8%,hsl(234_65%_52%/0.12),transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(165deg,hsl(263_40%_96%/0.9)_0%,transparent_42%,hsl(234_50%_94%/0.5)_100%)] dark:bg-[linear-gradient(165deg,hsl(263_30%_14%/0.35)_0%,transparent_45%,hsl(234_35%_12%/0.25)_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-indigo-500/[0.12] blur-3xl dark:bg-indigo-500/[0.14]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-violet-500/[0.1] blur-3xl dark:bg-violet-500/[0.12]"
      />
      <Suspense fallback={<LoginFallback />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
