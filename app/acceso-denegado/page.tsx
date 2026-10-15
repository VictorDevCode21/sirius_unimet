import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="surface reveal w-full max-w-md p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-[#f68629]/15 text-[var(--brand-orange)]">
          <ShieldAlert className="h-6 w-6" />
        </span>
        <p className="eyebrow mt-6">Error 403</p>
        <h1 className="page-title mt-2">Acceso denegado</h1>
        <p className="mt-3 text-sm text-muted-foreground">Tu rol no tiene permiso para ver esta sección.</p>
        <Link href="/" className="primary-button mt-6">
          Volver a mi portal
        </Link>
      </div>
    </main>
  )
}
