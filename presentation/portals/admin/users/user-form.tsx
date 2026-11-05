'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap, KeyRound, LoaderCircle, Mail, Save, ShieldCheck, UserRound } from 'lucide-react'
import type { CareerOption } from '@/control/controllers/user.queries'
import { createUser } from '@/control/controllers/user.controller'
import { FormMessage } from '@/presentation/components/shared/form-message'
import { ROLE_OPTIONS } from '@/presentation/lib/roles'
import { useAction } from '@/presentation/lib/use-action'

const inputClass = 'min-w-0 flex-1 border-0 bg-transparent py-3.5 text-[0.95rem] text-foreground outline-0'
const selectClass = `${inputClass} cursor-pointer`

// Form to create a user; the career field appears only for students.
export function UserForm({ careers }: { careers: CareerOption[] }) {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', role: 'STUDENT', password: '', careerId: '' })
  const { pending, result, run } = useAction()

  const update = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((current) => ({ ...current, [field]: event.target.value }))

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const response = await run(() => createUser(form))
    if (response?.ok) router.push('/admin/users')
  }

  return (
    <form className="surface reveal reveal-1 grid max-w-3xl gap-5 p-5 sm:p-7" onSubmit={submit} noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex min-w-0 flex-col gap-1.5 text-sm font-bold">
          Nombre
          <span className="field">
            <UserRound aria-hidden="true" />
            <input className={inputClass} value={form.name} onChange={update('name')} autoComplete="off" required />
          </span>
        </label>
        <label className="flex min-w-0 flex-col gap-1.5 text-sm font-bold">
          Correo
          <span className="field">
            <Mail aria-hidden="true" />
            <input className={inputClass} type="email" value={form.email} onChange={update('email')} autoComplete="off" required />
          </span>
        </label>
        <label className="flex min-w-0 flex-col gap-1.5 text-sm font-bold">
          Rol
          <span className="field">
            <ShieldCheck aria-hidden="true" />
            <select className={selectClass} value={form.role} onChange={update('role')}>
              {ROLE_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </span>
        </label>
        <label className="flex min-w-0 flex-col gap-1.5 text-sm font-bold">
          Contraseña inicial
          <span className="field">
            <KeyRound aria-hidden="true" />
            <input className={inputClass} type="password" value={form.password} onChange={update('password')} autoComplete="new-password" required />
          </span>
        </label>
        {form.role === 'STUDENT' && (
          <label className="flex min-w-0 flex-col gap-1.5 text-sm font-bold sm:col-span-2">
            Carrera
            <span className="field">
              <GraduationCap aria-hidden="true" />
              <select className={selectClass} value={form.careerId} onChange={update('careerId')} required>
                <option value="">Elige una carrera</option>
                {careers.map((career) => (
                  <option key={career.id} value={career.id}>
                    {career.name}
                  </option>
                ))}
              </select>
            </span>
          </label>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="primary-button" disabled={pending}>
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Crear usuario
        </button>
        <FormMessage result={result} />
      </div>
    </form>
  )
}
