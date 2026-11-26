import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { prisma, temporaryTermName, uniqueSuffix } from './admin-db'
import { publishSectionGrades, saveGrade } from '@/data-access/repositories/grade-management.repository'
import { assertAdminCanCorrect, assertProfessorCanEdit, validatePublishable, validateStudentInSection } from '@/domain/grades/grade-rules'
import { DomainError } from '@/domain/shared/domain-error'
import { getSubjectStates } from '@/domain/prerequisites/prerequisite.service'
import { markFailedSubjects } from '@/domain/grades/course-outcome'

// Runs the real flowchart service for a student taking the only prerequisite of another subject.
describe('grades in the flowchart', () => {
  const name = temporaryTermName()
  const email = `flow-${uniqueSuffix()}@test.local`
  const today = new Date('2096-02-01T00:00:00Z')
  let termId: string
  let sectionId: string
  let studentId: string
  let careerId: string
  let requirementId: string
  let dependentId: string

  const statuses = async () => {
    const { subjects } = await getSubjectStates(studentId, careerId, today)
    const statusOf = (id: string) => subjects.find((subject) => subject.id === id)?.status
    return { requirement: statusOf(requirementId), dependent: statusOf(dependentId) }
  }

  // Same mapping as the flowchart controller: published grades mark the failed subjects.
  const failedMark = async () => {
    const { subjects, grades } = await getSubjectStates(studentId, careerId, today)
    const marked = markFailedSubjects(
      subjects,
      grades.map((grade) => ({ subjectId: grade.section.subjectId, passed: grade.status === 'PASSED' })),
    )
    return marked.find((subject) => subject.id === requirementId)?.failed
  }

  before(async () => {
    const dependent = (
      await prisma.subject.findMany({
        where: { minCredits: null, alternativeCredits: null },
        include: { prerequisites: { include: { requirement: { include: { prerequisites: true } } } } },
        orderBy: { code: 'asc' },
      })
    ).find(({ prerequisites }) => {
      const requirement = prerequisites[0]?.requirement
      return prerequisites.length === 1 && !requirement.prerequisites.length && !requirement.minCredits
    })!
    dependentId = dependent.id
    careerId = dependent.careerId
    requirementId = dependent.prerequisites[0].requirementId

    termId = (await prisma.term.create({ data: { name, startsAt: new Date('2096-01-08T00:00:00Z'), endsAt: new Date('2096-04-05T00:00:00Z') } })).id
    const professor = await prisma.user.findFirstOrThrow({ where: { role: 'PROFESSOR' } })
    sectionId = (await prisma.section.create({ data: { number: 1, capacity: 10, subjectId: requirementId, termId, professorId: professor.id } })).id
    studentId = (await prisma.user.create({ data: { name: 'Estudiante', email, passwordHash: 'x', role: 'STUDENT', careerId } })).id
    await prisma.enrollment.create({ data: { studentId, termId, status: 'CONFIRMED', details: { create: { sectionId } } } })
  })

  after(async () => {
    await prisma.grade.deleteMany({ where: { sectionId } })
    await prisma.enrollment.deleteMany({ where: { termId } })
    await prisma.section.deleteMany({ where: { termId } })
    await prisma.term.deleteMany({ where: { id: termId } })
    await prisma.user.deleteMany({ where: { email } })
    await prisma.$disconnect()
  })

  it('keeps the subject in progress while the grade is not published', async () => {
    await saveGrade({ sectionId, studentId, value: 8, status: 'FAILED' }, validateStudentInSection, assertProfessorCanEdit)
    assert.deepEqual(await statuses(), { requirement: 'IN_PROGRESS', dependent: 'BLOCKED' })
    assert.equal(await failedMark(), false)
  })

  it('leaves a failed subject pending after publishing', async () => {
    await publishSectionGrades(sectionId, validatePublishable)
    assert.deepEqual(await statuses(), { requirement: 'AVAILABLE', dependent: 'BLOCKED' })
  })

  it('marks the published failed subject as Reprobada while it stays available', async () => {
    assert.equal(await failedMark(), true)
  })

  it('blocks the professor from changing a published grade', async () => {
    await assert.rejects(saveGrade({ sectionId, studentId, value: 15, status: 'PASSED' }, validateStudentInSection, assertProfessorCanEdit), DomainError)
    const grade = await prisma.grade.findUniqueOrThrow({ where: { sectionId_studentId: { sectionId, studentId } } })
    assert.equal(grade.value, 8)
  })

  it('recalculates the flowchart after an admin correction', async () => {
    await saveGrade({ sectionId, studentId, value: 15, status: 'PASSED' }, validateStudentInSection, assertAdminCanCorrect)
    assert.deepEqual(await statuses(), { requirement: 'PASSED', dependent: 'AVAILABLE' })
    assert.equal(await failedMark(), false)
  })
})
