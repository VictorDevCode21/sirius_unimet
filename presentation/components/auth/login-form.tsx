'use client'

import { useActionState, useEffect, useState } from 'react'
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from 'lucide-react'
import { login, type LoginState } from '@/control/controllers/authentication.controller'
import { notifyError } from '@/presentation/lib/notify'

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(login, {})
  const [showPassword, setShowPassword] = useState(false)
  const hasError = Boolean(state.error) && !isPending

  useEffect(() => {
    if (state.error) notifyError(state.error)
  }, [state])

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-5" noValidate>
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? '/'} />

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
          Correo institucional
        </label>
        <div className="field" data-invalid={hasError}>
          <Mail aria-hidden="true" />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            defaultValue={state.email}
            placeholder="nombre@correo.unimet.edu.ve"
            required
            aria-invalid={hasError}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
          Contraseña
        </label>
        <div className="field" data-invalid={hasError}>
          <LockKeyhole aria-hidden="true" />
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            required
            aria-invalid={hasError}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="-mr-1 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      </div>


      <button type="submit" className="brand-button mt-1" disabled={isPending}>
        {isPending ? (
          <>
            <LoaderCircle className="animate-spin" aria-hidden="true" /> Verificando…
          </>
        ) : (
          <>
            Iniciar sesión <ArrowRight className="arrow" aria-hidden="true" />
          </>
        )}
      </button>
    </form>
  )
}
