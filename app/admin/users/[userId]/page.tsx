import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getAssignableCareers, getUserForEdit } from '@/control/controllers/user.queries'
import { PageHeading } from '@/presentation/components/shared/page-heading'
import { UserForm } from '@/presentation/portals/admin/users/user-form'
import { UserStatusToggle } from '@/presentation/portals/admin/users/user-status-toggle'

export default async function EditUserPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const [user, careers] = await Promise.all([getUserForEdit(userId), getAssignableCareers()])
  if (!user) notFound()

  return (
    <div className="content-container">
      <Link href="/admin/users" className="secondary-button mb-5">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a usuarios
      </Link>
      <PageHeading eyebrow="Usuarios" title="Editar usuario" description="Un cambio de rol se aplica la próxima vez que la persona inicie sesión." />
      <UserForm key={user.id} careers={careers} user={user} />
      <UserStatusToggle userId={user.id} active={user.active} />
    </div>
  )
}
