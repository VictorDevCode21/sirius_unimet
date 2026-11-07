import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createCareerSchema } from '@/control/validation/career.schema'
import { canDeleteCareer } from '@/domain/careers/career-rules'

describe('canDeleteCareer', () => {
  it('allows deleting an unused career', () => {
    assert.equal(canDeleteCareer({ studentCount: 0, subjectCount: 0 }), true)
  })

  it('blocks a career with students or subjects', () => {
    assert.equal(canDeleteCareer({ studentCount: 1, subjectCount: 0 }), false)
    assert.equal(canDeleteCareer({ studentCount: 0, subjectCount: 1 }), false)
  })
})

describe('createCareerSchema', () => {
  it('requires a name and a department', () => {
    const departmentId = '00000000-0000-4000-8000-000000000000'
    assert.equal(createCareerSchema.safeParse({ name: 'Ingeniería Civil', departmentId }).success, true)
    assert.equal(createCareerSchema.safeParse({ name: ' ', departmentId }).success, false)
    assert.equal(createCareerSchema.safeParse({ name: 'Ingeniería Civil', departmentId: '' }).success, false)
  })
})
