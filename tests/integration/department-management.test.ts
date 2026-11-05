import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { prisma, uniqueSuffix } from './admin-db'
import {
  assignDepartmentHead,
  createDepartment,
  findHeadCandidate,
  listDepartments,
} from '@/data-access/repositories/department-management.repository'

describe('department management', () => {
  const name = `Departamento ${uniqueSuffix()}`
  const otherName = `Departamento ${uniqueSuffix()}`
  const email = `head-${uniqueSuffix()}@test.local`
  let headId: string

  before(async () => {
    headId = (await prisma.user.create({ data: { name: 'Jefe prueba', email, passwordHash: 'x', role: 'DEPARTMENT_HEAD' } })).id
  })

  after(async () => {
    await prisma.department.deleteMany({ where: { name: { in: [name, otherName] } } })
    await prisma.user.deleteMany({ where: { email } })
    await prisma.$disconnect()
  })

  it('creates a department that appears in the list', async () => {
    await createDepartment(name)
    assert.ok((await listDepartments()).some((department) => department.name === name))
  })

  it('blocks a repeated name, ignoring case', async () => {
    assert.equal(await createDepartment(name.toUpperCase()), null)
  })

  it('assigns a head, and the database keeps one department per head', async () => {
    const department = await prisma.department.findUniqueOrThrow({ where: { name } })
    await assignDepartmentHead(department.id, headId)
    assert.equal((await findHeadCandidate(headId))?.headedDepartmentId, department.id)

    const other = await createDepartment(otherName)
    assert.equal(await assignDepartmentHead(other!.id, headId), null)
  })
})
