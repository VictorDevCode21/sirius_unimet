import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { prisma } from './admin-db'
import { createTemporaryCareer } from './curriculum-db'
import { createCurriculumRepository } from '@/data-access/repositories/curriculum.repository'
import { findCareerSubjectSections, findCareerSubjects } from '@/data-access/repositories/curriculum-management.repository'
import { importCurriculum } from '@/domain/curriculum/csv-importer'
import { compareCurriculum } from '@/domain/curriculum/curriculum-diff'

const header = 'code,name,credits,term,branch,min_credits,prerequisites,alternative'
const csv = (...lines: string[]) => [header, ...lines].join('\n')

describe('curriculum import confirmation', () => {
  let temporary: Awaited<ReturnType<typeof createTemporaryCareer>>
  const writer = createCurriculumRepository(prisma)

  before(async () => {
    temporary = await createTemporaryCareer()
  })

  after(async () => {
    await temporary.remove()
    await prisma.$disconnect()
  })

  it('saves the subjects and prerequisites of a valid file', async () => {
    const result = await importCurriculum(temporary.career.id, csv('TST01,Uno,3,1,1,,,', 'TST02,Dos,3,2,1,,TST01,', 'TST03,Tres,3,3,1,3,TST02,'), writer)
    assert.deepEqual(result, { ok: true, subjects: 3, prerequisites: 2 })
    const subjects = await findCareerSubjects(temporary.career.id)
    assert.deepEqual(subjects.map((subject) => subject.code), ['TST01', 'TST02', 'TST03'])
    assert.equal(subjects.find((subject) => subject.code === 'TST03')?.minCredits, 3)
  })

  it('replaces the previous curriculum of the career', async () => {
    await importCurriculum(temporary.career.id, csv('TST01,Uno renombrada,4,1,1,,,', 'TST04,Cuatro,3,2,2,,TST01,'), writer)
    const subjects = await findCareerSubjects(temporary.career.id)
    assert.deepEqual(
      subjects.map(({ code, name, credits }) => ({ code, name, credits })),
      [
        { code: 'TST01', name: 'Uno renombrada', credits: 4 },
        { code: 'TST04', name: 'Cuatro', credits: 3 },
      ],
    )
    assert.equal(subjects.find((subject) => subject.code === 'TST04')?.prerequisites.length, 1)
  })

  it('saves nothing when the file has errors', async () => {
    const result = await importCurriculum(temporary.career.id, csv('TST09,Nueve,0,1,1,,,'), writer)
    assert.equal(result.ok, false)
    assert.equal((await findCareerSubjects(temporary.career.id)).length, 2)
  })

  it('blocks removing a subject that already has sections', async () => {
    const current = await findCareerSubjectSections(temporary.career.id)
    const withSections = current.map((subject) => (subject.code === 'TST04' ? { ...subject, sections: 1 } : subject))
    assert.deepEqual(compareCurriculum(['TST01'], withSections).blocked, ['TST04'])
  })

  it('imports a file that swaps the cells of two existing subjects', async () => {
    await importCurriculum(temporary.career.id, csv('TST01,Uno,3,1,1,,,', 'TST04,Cuatro,3,2,2,,TST01,'), writer)
    const before = await findCareerSubjects(temporary.career.id)
    const result = await importCurriculum(temporary.career.id, csv('TST01,Uno,3,2,2,,,', 'TST04,Cuatro,3,1,1,,,'), writer)
    assert.deepEqual(result, { ok: true, subjects: 2, prerequisites: 0 })
    const after = await findCareerSubjects(temporary.career.id)
    assert.deepEqual(
      after.map(({ code, term, branch }) => ({ code, term, branch })),
      [
        { code: 'TST04', term: 1, branch: 1 },
        { code: 'TST01', term: 2, branch: 2 },
      ],
    )
    // Kept subjects keep their ids, so their sections stay attached.
    assert.deepEqual(
      after.map((subject) => subject.id).sort(),
      before.map((subject) => subject.id).sort(),
    )
  })

  it('refuses, inside the import, to drop a subject that has sections', async () => {
    const term = await prisma.term.findFirstOrThrow({ where: { open: true } })
    const professor = await prisma.user.findFirstOrThrow({ where: { role: 'PROFESSOR', NOT: { email: { endsWith: '@test.local' } } } })
    const subject = await prisma.subject.findFirstOrThrow({ where: { careerId: temporary.career.id, code: 'TST04' } })
    const section = await prisma.section.create({ data: { number: 1, capacity: 10, termId: term.id, subjectId: subject.id, professorId: professor.id } })
    try {
      await assert.rejects(importCurriculum(temporary.career.id, csv('TST01,Uno,3,1,1,,,'), writer), /TST04 tiene secciones/)
      assert.equal((await findCareerSubjects(temporary.career.id)).length, 2)
    } finally {
      await prisma.section.delete({ where: { id: section.id } })
    }
  })
})
