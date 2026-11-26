import 'server-only'
import { requireRole } from '@/control/auth/session'
import { listCareers, listDepartmentOptions } from '@/data-access/repositories/career-management.repository'

export async function getCareers() {
  await requireRole('ADMIN')
  const [careers, departments] = await Promise.all([listCareers(), listDepartmentOptions()])
  return {
    departments,
    careers: careers.map((career) => ({
      id: career.id,
      name: career.name,
      active: career.active,
      department: career.department.name,
      studentCount: career._count.students,
      subjectCount: career._count.subjects,
    })),
  }
}

export type CareerView = Awaited<ReturnType<typeof getCareers>>['careers'][number]
export type DepartmentOption = Awaited<ReturnType<typeof getCareers>>['departments'][number]
