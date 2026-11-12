import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { prisma } from './admin-db'
import { createTemporaryCareer } from './curriculum-db'
import { createSubject, findSubject, updateSubject } from '@/data-access/repositories/curriculum-management.repository'

describe('subject edit and move', () => {
  let temporary: Awaited<ReturnType<typeof createTemporaryCareer>>
  let subjectId: string

  before(async () => {
    temporary = await createTemporaryCareer()
    const first = await createSubject(temporary.career.id, { code: 'TST01', name: 'Primera', credits: 3, term: 1, branch: 1 })
    const second = await createSubject(temporary.career.id, { code: 'TST02', name: 'Segunda', credits: 3, term: 2, branch: 1 })
    await prisma.prerequisite.create({ data: { subjectId: second!.id, requirementId: first!.id } })
    subjectId = second!.id
  })

  after(async () => {
    await temporary.remove()
    await prisma.$disconnect()
  })

  it('edits the data and moves the subject to another cell, keeping its prerequisites', async () => {
    const updated = await updateSubject(subjectId, { code: 'TST02', name: 'Segunda editada', credits: 4, term: 3, branch: 2 })
    assert.deepEqual(
      { name: updated?.name, credits: updated?.credits, term: updated?.term, branch: updated?.branch },
      { name: 'Segunda editada', credits: 4, term: 3, branch: 2 },
    )
    const subject = await findSubject(subjectId)
    assert.deepEqual(subject?.prerequisites.map((prerequisite) => prerequisite.requirement.code), ['TST01'])
  })

  it('returns null when moving to an occupied cell', async () => {
    assert.equal(await updateSubject(subjectId, { code: 'TST02', name: 'Segunda', credits: 3, term: 1, branch: 1 }), null)
  })
})
