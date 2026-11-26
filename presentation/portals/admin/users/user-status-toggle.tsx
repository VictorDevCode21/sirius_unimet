'use client'

import { LoaderCircle, UserCheck, UserX } from 'lucide-react'
import { setUserStatus } from '@/control/controllers/user.controller'
import { FormMessage } from '@/presentation/components/shared/form-message'
import { useAction } from '@/presentation/lib/use-action'

// Activates or deactivates a user. Deactivating is a soft delete: the history is kept.
export function UserStatusToggle({ userId, active }: { userId: string; active: boolean }) {
  const { pending, result, run } = useAction()
  const Icon = pending ? LoaderCircle : active ? UserX : UserCheck

  return (
    <section className="surface reveal reveal-2 mt-5 grid max-w-3xl gap-3 p-5 sm:p-7">
      <h2 className="text-lg font-bold">Estado de la cuenta</h2>
      <p className="text-sm text-muted-foreground">
        {active
          ? 'Al desactivar la cuenta, la persona no podrá iniciar sesión. Su historial se conserva.'
          : 'La cuenta está inactiva. Al activarla, la persona podrá iniciar sesión de nuevo.'}
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <button type="button" className="secondary-button" disabled={pending} onClick={() => run(() => setUserStatus(userId, !active))}>
          <Icon className={pending ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} aria-hidden="true" />
          {active ? 'Desactivar cuenta' : 'Activar cuenta'}
        </button>
        <FormMessage result={result} />
      </div>
    </section>
  )
}
