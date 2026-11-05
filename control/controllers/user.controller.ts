'use server'

import { hashPassword } from '@/control/auth/password'
import { requireRole } from '@/control/auth/session'
import { runAction, type ActionResult } from '@/control/controllers/action-result'
import { createUserSchema } from '@/control/validation/user.schema'
import { createUser as insertUser, findCareerById } from '@/data-access/repositories/user-management.repository'
import { DomainError } from '@/domain/shared/domain-error'
import { EMAIL_TAKEN_MESSAGE, validateStudentCareer } from '@/domain/users/user-rules'

interface UserFormInput {
  name: string
  email: string
  role: string
  careerId: string
}

// Creates a user with a role and an initial password; students must be assigned a career.
export async function createUser(input: UserFormInput & { password: string }): Promise<ActionResult> {
  await requireRole('ADMIN')
  const parsed = createUserSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }

  return runAction(async () => {
    const { password, careerId, ...data } = parsed.data
    const assignedCareerId = data.role === 'STUDENT' ? careerId : null
    validateStudentCareer(data.role, assignedCareerId ? await findCareerById(assignedCareerId) : null)

    const user = await insertUser({ ...data, careerId: assignedCareerId, passwordHash: await hashPassword(password) })
    if (!user) throw new DomainError(EMAIL_TAKEN_MESSAGE)
    return `${user.name} se registró correctamente.`
  }, ['/admin/users'])
}
