import { Suspense, type ReactNode } from 'react'

function Fallback() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4">
      <p className="text-sm text-muted-foreground">…</p>
    </div>
  )
}

export default function RecoverMfaLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<Fallback />}>{children}</Suspense>
}
