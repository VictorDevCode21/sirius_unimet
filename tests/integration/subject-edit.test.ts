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
    assert.ok(first.ok && second.ok)
    await prisma.prerequisite.create({ data: { subjectId: second.subject.id, requirementId: first.subject.id } })
    subjectId = second.subject.id
  })

  after(async () => {
    await temporary.remove()
    await prisma.$disconnect()
  })

  it('edits the data and moves the subject to another cell, keeping its prerequisites', async () => {
    const result = await updateSubject(subjectId, temporary.career.id, { code: 'TST02', name: 'Segunda editada', credits: 4, term: 3, branch: 2 })
    assert.ok(result.ok)
    const updated = result.subject
    assert.deepEqual(
      { name: updated.name, credits: updated.credits, term: updated.term, branch: updated.branch },
      { name: 'Segunda editada', credits: 4, term: 3, branch: 2 },
    )
    const subject = await findSubject(subjectId)
    assert.deepEqual(subject?.prerequisites.map((prerequisite) => prerequisite.requirement.code), ['TST01'])
  })

  it('names the occupied cell when moving onto another subject', async () => {
    assert.deepEqual(await updateSubject(subjectId, temporary.career.id, { code: 'TST02', name: 'Segunda', credits: 3, term: 1, branch: 1 }), {
      ok: false,
      conflict: 'cell',
    })
  })

  it('names the repeated code when taking the code of another subject', async () => {
    assert.deepEqual(await updateSubject(subjectId, temporary.career.id, { code: 'TST01', name: 'Segunda', credits: 3, term: 5, branch: 5 }), {
      ok: false,
      conflict: 'code',
    })
  })
})
