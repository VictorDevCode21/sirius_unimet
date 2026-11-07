import 'server-only'
import { requireRole } from '@/control/auth/session'
import { listDepartments, listHeadCandidates } from '@/data-access/repositories/department-management.repository'

// Departments of the admin portal, each with the heads that can be assigned to it.
export async function getDepartments() {
  await requireRole('ADMIN')
  const [departments, candidates] = await Promise.all([listDepartments(), listHeadCandidates()])
  return departments.map((department) => ({
    id: department.id,
    name: department.name,
    headId: department.headId,
    headName: department.head?.name ?? null,
    careerCount: department._count.careers,
    candidates: candidates
      .filter((candidate) => !candidate.headedDepartment || candidate.headedDepartment.id === department.id)
      .map(({ id, name }) => ({ id, name })),
  }))
}

export type DepartmentView = Awaited<ReturnType<typeof getDepartments>>[number]
