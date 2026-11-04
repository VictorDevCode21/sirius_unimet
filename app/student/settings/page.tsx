import { getSettingsProfile } from '@/control/controllers/settings.controller'
import { PageHeading } from '@/presentation/components/shared/page-heading'
import { ProfileSection } from '@/presentation/portals/student/settings/profile-section'
import { ZoomSetting } from '@/presentation/portals/student/settings/zoom-setting'

export default async function SettingsPage() {
  const profile = await getSettingsProfile()

  return (
    <div className="content-container">
      <PageHeading eyebrow="Tu cuenta" title="Ajustes" description="Consulta tus datos y ajusta cómo se ve el portal." />
      <div className="flex flex-col gap-6">
        <ProfileSection profile={profile} />
        <ZoomSetting />
      </div>
    </div>
  )
}
