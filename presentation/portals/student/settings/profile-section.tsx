import { GraduationCap, Mail, ShieldCheck, UserRound } from 'lucide-react'
import type { SettingsProfile } from '@/control/controllers/settings.controller'

const roleLabels: Record<SettingsProfile['role'], string> = {
  STUDENT: 'Estudiante',
}

// Read-only list of the signed-in user's profile data.
export function ProfileSection({ profile }: { profile: SettingsProfile }) {
  const rows = [
    { label: 'Nombre', value: profile.name, icon: UserRound },
    { label: 'Correo institucional', value: profile.email, icon: Mail },
    { label: 'Rol', value: roleLabels[profile.role], icon: ShieldCheck },
    ...(profile.career ? [{ label: 'Carrera', value: profile.career, icon: GraduationCap }] : []),
  ]

  return (
    <section className="surface card-pad reveal reveal-1" aria-labelledby="profile-title">
      <h2 id="profile-title" className="text-lg font-bold">
        Perfil
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Estos datos vienen de tu registro académico. Para corregirlos, comunícate con Control de Estudios.
      </p>
      <dl className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
        {rows.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-start gap-3 rounded-[1.1rem] bg-muted p-4">
            <span className="stat-icon bg-[#003087]/10 text-[#003087] dark:bg-[#1859a9]/25 dark:text-[#8fb8ff]">
              <Icon aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
              <dd className="mt-0.5 text-sm font-bold [overflow-wrap:anywhere]">{value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  )
}
