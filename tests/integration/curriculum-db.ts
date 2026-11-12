import { prisma, uniqueSuffix } from './admin-db'

// Temporary career with an empty curriculum, removed with its subjects after the test.
export async function createTemporaryCareer() {
  const department = await prisma.department.findFirstOrThrow()
  const career = await prisma.career.create({ data: { name: `Carrera de prueba ${uniqueSuffix()}`, departmentId: department.id } })
  return {
    career,
    async remove() {
      await prisma.prerequisite.deleteMany({ where: { subject: { careerId: career.id } } })
      await prisma.subject.deleteMany({ where: { careerId: career.id } })
      await prisma.career.delete({ where: { id: career.id } })
    },
  }
}
