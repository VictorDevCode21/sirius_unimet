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
