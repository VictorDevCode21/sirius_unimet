import 'dotenv/config'
import { prisma } from '@/data-access/prisma'

// Integration tests run against the database in DATABASE_URL, which must be migrated and seeded (npm run db:reset).
export { prisma }

export async function findSeedFixtures() {
  const department = await prisma.department.findUniqueOrThrow({ where: { name: 'Ingeniería' } })
  const openTerm = await prisma.term.findFirstOrThrow({ where: { open: true } })
  const professor = await prisma.user.findFirstOrThrow({ where: { role: 'PROFESSOR', active: true }, orderBy: { email: 'asc' } })
  const student = await prisma.user.findUniqueOrThrow({ where: { email: 'r.victor@correo.unimet.edu.ve' } })
  return { department, openTerm, professor, student }
}

// Creates throwaway students enrolled (PRE_ENROLLED) in a section; returns their ids for cleanup.
export async function enrollTemporaryStudents(sectionId: string, termId: string, count: number) {
  const ids: string[] = []
  for (let index = 0; index < count; index++) {
    const student = await prisma.user.create({
      data: { name: `Estudiante prueba ${index}`, email: `test-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`, passwordHash: 'x', role: 'STUDENT' },
    })
    ids.push(student.id)
    await prisma.enrollment.create({ data: { studentId: student.id, termId, details: { create: { sectionId } } } })
  }
  return ids
}

export async function removeTemporaryStudents(studentIds: string[]) {
  await prisma.enrollment.deleteMany({ where: { studentId: { in: studentIds } } })
  await prisma.user.deleteMany({ where: { id: { in: studentIds } } })
}
