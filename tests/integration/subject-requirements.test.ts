import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { prisma } from './admin-db'
import { createTemporaryCareer } from './curriculum-db'
import { requirementsSchema } from '@/control/validation/subject.schema'
import { createSubject, findCareerSubjects, replaceSubjectRequirements } from '@/data-access/repositories/curriculum-management.repository'

describe('subject requirements', () => {
  let temporary: Awaited<ReturnType<typeof createTemporaryCareer>>
  const ids: Record<string, string> = {}

  before(async () => {
    temporary = await createTemporaryCareer()
    for (const [code, term] of [['TST01', 1], ['TST02', 1], ['TST03', 2]] as const) {
      ids[code] = (await createSubject(temporary.career.id, { code, name: `Materia ${code}`, credits: 3, term, branch: Number(code.slice(-1)) }))!.id
    }
  })

  after(async () => {
    await temporary.remove()
    await prisma.$disconnect()
  })

  it('saves prerequisites, minimum credits and the credit alternative', async () => {
    await replaceSubjectRequirements(ids.TST03, {
      requirementIds: [ids.TST01, ids.TST02],
      minCredits: 6,
      alternativeCredits: 30,
      alternativeCreditBlock: 'TS',
    })
    const subject = (await findCareerSubjects(temporary.career.id)).find((other) => other.id === ids.TST03)!
    assert.deepEqual(new Set(subject.prerequisites.map((prerequisite) => prerequisite.requirementId)), new Set([ids.TST01, ids.TST02]))
    assert.deepEqual([subject.minCredits, subject.alternativeCredits, subject.alternativeCreditBlock], [6, 30, 'TS'])
  })

  it('replaces the previous requirements', async () => {
    await replaceSubjectRequirements(ids.TST03, { requirementIds: [ids.TST02], minCredits: null, alternativeCredits: null, alternativeCreditBlock: null })
    const subject = (await findCareerSubjects(temporary.career.id)).find((other) => other.id === ids.TST03)!
    assert.deepEqual(subject.prerequisites.map((prerequisite) => prerequisite.requirementId), [ids.TST02])
    assert.equal(subject.minCredits, null)
  })
})

describe('requirements input', () => {
  const subjectId = '6f1f0c2e-8a3b-4c1d-9e2f-1a2b3c4d5e6f'

  it('treats empty credit fields as not set and removes repeated prerequisites', () => {
    const parsed = requirementsSchema.parse({ subjectId, requirementIds: [subjectId, subjectId], minCredits: '', alternativeCredits: '', alternativeCreditBlock: ' ' })
    assert.deepEqual(parsed, { subjectId, requirementIds: [subjectId], minCredits: null, alternativeCredits: null, alternativeCreditBlock: null })
  })

  it('rejects negative minimum credits', () => {
    assert.equal(requirementsSchema.safeParse({ subjectId, requirementIds: [], minCredits: '-3' }).success, false)
  })
})
