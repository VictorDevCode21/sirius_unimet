import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { prisma } from './admin-db'
import { createTemporaryCareer } from './curriculum-db'
import { createSubject, findCareerSubjects } from '@/data-access/repositories/curriculum-management.repository'

describe('subject registration in the curriculum grid', () => {
  let temporary: Awaited<ReturnType<typeof createTemporaryCareer>>

  before(async () => {
    temporary = await createTemporaryCareer()
  })

  after(async () => {
    await temporary.remove()
    await prisma.$disconnect()
  })

  it('registers a subject in an empty cell and lists it in the grid', async () => {
    const subject = await createSubject(temporary.career.id, { code: 'TST01', name: 'Materia de prueba', credits: 3, term: 1, branch: 1 })
    assert.equal(subject?.code, 'TST01')

    const subjects = await findCareerSubjects(temporary.career.id)
    assert.deepEqual(
      subjects.map(({ code, term, branch }) => ({ code, term, branch })),
      [{ code: 'TST01', term: 1, branch: 1 }],
    )
  })

  it('returns null for an occupied cell', async () => {
    assert.equal(await createSubject(temporary.career.id, { code: 'TST02', name: 'Otra', credits: 3, term: 1, branch: 1 }), null)
  })

  it('returns null for a repeated code in the same career', async () => {
    assert.equal(await createSubject(temporary.career.id, { code: 'TST01', name: 'Otra', credits: 3, term: 2, branch: 1 }), null)
  })
})
