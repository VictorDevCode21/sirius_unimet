import { prisma } from '@/data-access/prisma'

type GradeOutcome = 'PASSED' | 'FAILED'

export function findSectionOwner(sectionId: string) {
  return prisma.section.findUnique({ where: { id: sectionId }, select: { professorId: true } })
}

const confirmedDetail = (sectionId: string) => ({ sectionId, enrollment: { status: 'CONFIRMED' as const } })

// Saves a grade under a row lock on the section, so saving never interleaves with publishing it.
export async function saveGrade(
  params: { sectionId: string; studentId: string; value: number; status: GradeOutcome },
  assertEnrolled: (enrolled: boolean) => void,
) {
  const { sectionId, studentId, value, status } = params
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Section" WHERE "id" = ${sectionId}::uuid FOR UPDATE`
    const enrolled = await tx.enrollmentDetail.count({ where: { ...confirmedDetail(sectionId), enrollment: { status: 'CONFIRMED', studentId } } })
    assertEnrolled(enrolled > 0)
    return tx.grade.upsert({
      where: { sectionId_studentId: { sectionId, studentId } },
      update: { value, status },
      create: { sectionId, studentId, value, status },
    })
  })
}

// Publishes every grade of a section once `assertPublishable` accepts the enrolled and graded counts.
export async function publishSectionGrades(sectionId: string, assertPublishable: (enrolledCount: number, gradedCount: number) => void) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Section" WHERE "id" = ${sectionId}::uuid FOR UPDATE`
    const details = await tx.enrollmentDetail.findMany({ where: confirmedDetail(sectionId), select: { enrollment: { select: { studentId: true } } } })
    const studentIds = details.map((detail) => detail.enrollment.studentId)
    const graded = await tx.grade.count({ where: { sectionId, studentId: { in: studentIds } } })
    assertPublishable(studentIds.length, graded)
    await tx.grade.updateMany({ where: { sectionId }, data: { published: true } })
  })
}
