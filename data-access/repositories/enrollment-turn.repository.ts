import { prisma } from '@/data-access/prisma'

// Active students with every published grade they have (value, subject credits and term start), used to order the
// enrollment turns by academic index.
export async function listStudentGradeRecords() {
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT', active: true },
    select: {
      id: true,
      grades: {
        where: { published: true },
        select: { value: true, section: { select: { subject: { select: { credits: true } }, term: { select: { startsAt: true } } } } },
      },
    },
  })
  return students.map((student) => ({
    studentId: student.id,
    grades: student.grades.map((grade) => ({
      value: Number(grade.value),
      credits: grade.section.subject.credits,
      termStartsAt: grade.section.term.startsAt,
    })),
  }))
}
