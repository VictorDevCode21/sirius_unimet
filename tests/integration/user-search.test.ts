import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { prisma, uniqueSuffix } from './admin-db'
import { createUser, listUsers } from '@/data-access/repositories/user-management.repository'

describe('user search', () => {
  const marker = `zq${uniqueSuffix().replace(/\W/g, '')}`
  const emails = [`${marker}.a@test.local`, `b-${uniqueSuffix()}@test.local`]

  before(async () => {
    await createUser({ name: 'Profesora Prueba', email: emails[0], passwordHash: 'x', role: 'PROFESSOR', careerId: null })
    await createUser({ name: `Jefa ${marker.toUpperCase()}`, email: emails[1], passwordHash: 'x', role: 'DEPARTMENT_HEAD', careerId: null })
  })

  after(async () => {
    await prisma.user.deleteMany({ where: { email: { in: emails } } })
    await prisma.$disconnect()
  })

  it('matches name or email, ignoring case', async () => {
    assert.equal((await listUsers({ search: marker })).length, 2)
  })

  it('filters by role, also combined with the search', async () => {
    const heads = await listUsers({ role: 'DEPARTMENT_HEAD' })
    assert.ok(heads.length >= 1 && heads.every((user) => user.role === 'DEPARTMENT_HEAD'))

    const combined = await listUsers({ search: marker, role: 'PROFESSOR' })
    assert.deepEqual(combined.map((user) => user.email), [emails[0]])
  })

  it('returns an empty list when nothing matches', async () => {
    assert.equal((await listUsers({ search: `${marker}-nadie` })).length, 0)
  })
})
