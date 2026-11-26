import 'dotenv/config'
import { after, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { prisma } from '@/data-access/prisma'
import { findConfirmedEnrollments } from '@/data-access/repositories/receipt.repository'

const cleanup: string[] = []

after(async () => {
  await prisma.enrollment.deleteMany({ where: { studentId: { in: cleanup } } })
  await prisma.user.deleteMany({ where: { id: { in: cleanup } } })
  await prisma.$disconnect()
})

describe('HU-19 confirmed enrollments for the receipt (database)', () => {
  it('returns the seeded confirmed enrollments with sections and approved payment, newest first', async () => {
    const student = await prisma.user.findUniqueOrThrow({ where: { email: 'r.victor@correo.unimet.edu.ve' } })
    const enrollments = await findConfirmedEnrollments(student.id)
    assert.ok(enrollments.length > 0)
    assert.ok(enrollments.every((enrollment) => enrollment.status === 'CONFIRMED' && enrollment.studentId === student.id))
    assert.equal(enrollments[0].term.name, '2627-1')
    assert.ok(enrollments[0].details.length > 0)
    assert.equal(enrollments[0].payments[0]?.status, 'APPROVED')
  })

  it('does not return unconfirmed enrollments', async () => {
    const term = await prisma.term.findFirstOrThrow({ where: { open: true } })
    const student = await prisma.user.create({ data: { name: 'Sin pago', email: `receipt-${Date.now()}@test.local`, passwordHash: 'x', role: 'STUDENT' } })
    cleanup.push(student.id)
    await prisma.enrollment.create({ data: { studentId: student.id, termId: term.id, status: 'PENDING' } })
    assert.equal((await findConfirmedEnrollments(student.id)).length, 0)
  })
})
