import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { prisma, temporaryTermName, uniqueSuffix } from './admin-db'
import { findPublishedGradesByStudent } from '@/data-access/repositories/grade.repository'
import { publishSectionGrades, saveGrade } from '@/data-access/repositories/grade-management.repository'
import { assertProfessorCanEdit, validatePublishable, validateStudentInSection } from '@/domain/grades/grade-rules'
import { DomainError } from '@/domain/shared/domain-error'

describe('grade upload', () => {
  const name = temporaryTermName()
  const emails = [`g1-${uniqueSuffix()}@test.local`, `g2-${uniqueSuffix()}@test.local`, `g3-${uniqueSuffix()}@test.local`]
  const students: string[] = []
  let termId: string
  let sectionId: string

  before(async () => {
    termId = (await prisma.term.create({ data: { name, startsAt: new Date('2095-01-08T00:00:00Z'), endsAt: new Date('2095-04-05T00:00:00Z') } })).id
    const subject = await prisma.subject.findFirstOrThrow()
    const professor = await prisma.user.findFirstOrThrow({ where: { role: 'PROFESSOR' } })
    sectionId = (await prisma.section.create({ data: { number: 1, capacity: 10, subjectId: subject.id, termId, professorId: professor.id } })).id

    for (const email of emails) {
      students.push((await prisma.user.create({ data: { name: 'Estudiante', email, passwordHash: 'x', role: 'STUDENT', careerId: subject.careerId } })).id)
    }
    for (const studentId of students.slice(0, 2)) {
      await prisma.enrollment.create({ data: { studentId, termId, status: 'CONFIRMED', details: { create: { sectionId } } } })
    }
  })

  after(async () => {
    await prisma.grade.deleteMany({ where: { sectionId } })
    await prisma.enrollment.deleteMany({ where: { termId } })
    await prisma.section.deleteMany({ where: { termId } })
    await prisma.term.deleteMany({ where: { id: termId } })
    await prisma.user.deleteMany({ where: { email: { in: emails } } })
    await prisma.$disconnect()
  })

  it('rejects a student who is not enrolled in the section', async () => {
    await assert.rejects(saveGrade({ sectionId, studentId: students[2], value: 15, status: 'PASSED' }, validateStudentInSection, assertProfessorCanEdit), DomainError)
  })

  it('keeps a saved grade hidden from the student until it is published', async () => {
    await saveGrade({ sectionId, studentId: students[0], value: 15, status: 'PASSED' }, validateStudentInSection, assertProfessorCanEdit)
    assert.equal((await findPublishedGradesByStudent(students[0])).length, 0)
  })

  it('blocks publishing while a grade is missing', async () => {
    await assert.rejects(publishSectionGrades(sectionId, validatePublishable), /Faltan 1 nota/)
  })

  it('shows the grades in the student history once published', async () => {
    await saveGrade({ sectionId, studentId: students[1], value: 8, status: 'FAILED' }, validateStudentInSection, assertProfessorCanEdit)
    await publishSectionGrades(sectionId, validatePublishable)
    const [grade] = await findPublishedGradesByStudent(students[0])
    assert.equal(grade.value, 15)
    assert.equal(grade.status, 'PASSED')
  })
})
