import 'server-only'
import { getStudentContext } from '@/control/controllers/student-context'

// Settings controller: read-only profile of the signed-in student.
export async function getSettingsProfile() {
  const { profile } = await getStudentContext()
  return {
    name: profile.name,
    email: profile.email,
    role: 'STUDENT' as const,
    career: profile.career?.name ?? null,
    department: profile.career?.department.name ?? null,
  }
}

export type SettingsProfile = Awaited<ReturnType<typeof getSettingsProfile>>
