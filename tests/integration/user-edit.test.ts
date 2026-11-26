import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { prisma, uniqueSuffix } from './admin-db'
import { findUserByEmail } from '@/data-access/repositories/user.repository'
import { createUser, findUserForEdit, setUserActive, updateUser } from '@/data-access/repositories/user-management.repository'

describe('user edition', () => {
  const email = `edit-${uniqueSuffix()}@test.local`
  const otherEmail = `edit-other-${uniqueSuffix()}@test.local`
  let userId: string

  before(async () => {
    const data = { name: 'Usuario prueba', passwordHash: 'x', role: 'PROFESSOR' as const, careerId: null }
    userId = (await createUser({ ...data, email }))!.id
    await createUser({ ...data, email: otherEmail })
  })

  after(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [email, otherEmail] } } })
    await prisma.$disconnect()
  })

  it('deactivates without deleting, and the login lookup sees the inactive flag', async () => {
    await setUserActive(userId, false)
    const stored = await findUserByEmail(email)
    assert.equal(stored?.id, userId)
    assert.equal(stored?.active, false)
    await setUserActive(userId, true)
  })

  it('saves a new role', async () => {
    await updateUser(userId, { name: 'Usuario prueba', email, role: 'DEPARTMENT_HEAD', careerId: null })
    assert.equal((await findUserForEdit(userId))?.role, 'DEPARTMENT_HEAD')
  })

  it('rejects an email that belongs to another user', async () => {
    const updated = await updateUser(userId, { name: 'Usuario prueba', email: otherEmail, role: 'PROFESSOR', careerId: null })
    assert.equal(updated, null)
    assert.equal((await findUserForEdit(userId))?.email, email)
  })
})
