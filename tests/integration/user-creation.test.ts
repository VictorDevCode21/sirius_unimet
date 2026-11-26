import { after, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { prisma, uniqueSuffix } from './admin-db'
import bcrypt from 'bcryptjs'
import { findUserByEmail } from '@/data-access/repositories/user.repository'
import { createUser, listUsers } from '@/data-access/repositories/user-management.repository'

describe('user creation', () => {
  const email = `create-${uniqueSuffix()}@test.local`

  after(async () => {
    await prisma.user.deleteMany({ where: { email } })
    await prisma.$disconnect()
  })

  it('stores a user that appears in the list and whose password verifies at login', async () => {
    const passwordHash = await bcrypt.hash('Segura123', 4)
    await createUser({ name: 'Usuario prueba', email, passwordHash, role: 'PROFESSOR', careerId: null })

    assert.ok((await listUsers()).some((user) => user.email === email))
    const stored = await findUserByEmail(email)
    assert.equal(stored?.active, true)
    assert.equal(await bcrypt.compare('Segura123', stored!.passwordHash), true)
  })

  it('returns null for a registered email and does not duplicate it', async () => {
    const created = await createUser({ name: 'Otro', email, passwordHash: 'x', role: 'PROFESSOR', careerId: null })
    assert.equal(created, null)
    assert.equal(await prisma.user.count({ where: { email } }), 1)
  })
})
