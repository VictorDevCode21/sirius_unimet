import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getAssignableCareers } from '@/control/controllers/user.queries'
import { PageHeading } from '@/presentation/components/shared/page-heading'
import { UserForm } from '@/presentation/portals/admin/users/user-form'

export default async function NewUserPage() {
  const careers = await getAssignableCareers()

  return (
    <div className="content-container">
      <Link href="/admin/users" className="secondary-button mb-5">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a usuarios
      </Link>
      <PageHeading eyebrow="Usuarios" title="Crear usuario" description="La persona podrá iniciar sesión con este correo y la contraseña inicial." />
      <UserForm careers={careers} />
    </div>
  )
}
