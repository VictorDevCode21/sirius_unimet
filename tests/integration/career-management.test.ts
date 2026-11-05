import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { prisma, uniqueSuffix } from './admin-db'
import {
  createCareer,
  deleteCareerIfUnused,
  findCareerUsage,
  listCareers,
  setCareerActive,
} from '@/data-access/repositories/career-management.repository'
import { canDeleteCareer } from '@/domain/careers/career-rules'
import { listActiveCareers } from '@/data-access/repositories/user-management.repository'

describe('career management', () => {
  const name = `Carrera ${uniqueSuffix()}`
  const email = `career-${uniqueSuffix()}@test.local`
  let departmentId: string
  let careerId: string

  before(async () => {
    departmentId = (await prisma.department.findFirstOrThrow()).id
    careerId = (await createCareer({ name, departmentId }))!.id
  })

  after(async () => {
    await prisma.user.deleteMany({ where: { email } })
    await prisma.career.deleteMany({ where: { name } })
    await prisma.$disconnect()
  })

  it('creates a career available to assign students', async () => {
    assert.ok((await listCareers()).some((career) => career.name === name))
    assert.ok((await listActiveCareers()).some((career) => career.id === careerId))
  })

  it('blocks a repeated name, ignoring case', async () => {
    assert.equal(await createCareer({ name: name.toLowerCase(), departmentId }), null)
  })

  it('stops offering a deactivated career', async () => {
    await setCareerActive(careerId, false)
    assert.ok(!(await listActiveCareers()).some((career) => career.id === careerId))
    await setCareerActive(careerId, true)
  })

  it('keeps a career with students and leaves them assigned to it', async () => {
    await prisma.user.create({ data: { name: 'Estudiante prueba', email, passwordHash: 'x', role: 'STUDENT', careerId } })
    assert.deepEqual(await deleteCareerIfUnused(careerId, canDeleteCareer), { outcome: 'in-use', active: true })
    assert.equal((await prisma.user.findUniqueOrThrow({ where: { email } })).careerId, careerId)
  })

  it('deletes an unused career', async () => {
    await prisma.user.deleteMany({ where: { email } })
    assert.equal((await deleteCareerIfUnused(careerId, canDeleteCareer)).outcome, 'deleted')
    assert.equal(await findCareerUsage(careerId), null)
  })

  it('reports an unknown career', async () => {
    assert.equal((await deleteCareerIfUnused(careerId, canDeleteCareer)).outcome, 'missing')
  })
})
