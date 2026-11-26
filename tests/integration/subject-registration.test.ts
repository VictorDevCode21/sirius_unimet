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
    const result = await createSubject(temporary.career.id, { code: 'TST01', name: 'Materia de prueba', credits: 3, term: 1, branch: 1 })
    assert.ok(result.ok)
    assert.equal(result.subject.code, 'TST01')

    const subjects = await findCareerSubjects(temporary.career.id)
    assert.deepEqual(
      subjects.map(({ code, term, branch }) => ({ code, term, branch })),
      [{ code: 'TST01', term: 1, branch: 1 }],
    )
  })

  it('names the occupied cell', async () => {
    assert.deepEqual(await createSubject(temporary.career.id, { code: 'TST02', name: 'Otra', credits: 3, term: 1, branch: 1 }), { ok: false, conflict: 'cell' })
  })

  it('names the repeated code in the same career', async () => {
    assert.deepEqual(await createSubject(temporary.career.id, { code: 'TST01', name: 'Otra', credits: 3, term: 2, branch: 1 }), { ok: false, conflict: 'code' })
  })

  it('refuses a career that does not exist without a database error', async () => {
    const missingCareer = '00000000-0000-4000-8000-000000000000'
    assert.deepEqual(await createSubject(missingCareer, { code: 'TST09', name: 'Sin carrera', credits: 3, term: 1, branch: 1 }), { ok: false, conflict: 'career' })
  })
})
