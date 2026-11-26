'use server'

import { hashPassword } from '@/control/auth/password'
import { requireRole } from '@/control/auth/session'
import { runAction, type ActionResult } from '@/control/controllers/action-result'
import { createUserSchema, updateUserSchema, userIdSchema } from '@/control/validation/user.schema'
import {
  createUser as insertUser,
  findCareerById,
  findUserForEdit,
  setUserActive,
  updateUser as saveUser,
} from '@/data-access/repositories/user-management.repository'
import { DomainError } from '@/domain/shared/domain-error'
import { EMAIL_TAKEN_MESSAGE, validateRoleChange, validateSelfChange, validateStudentCareer } from '@/domain/users/user-rules'

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

const USER_NOT_FOUND = 'El usuario no existe. Recarga la página.'

// Updates a user. A new role takes effect on the next login, because the role travels in the session token.
export async function updateUser(input: UserFormInput & { userId: string }): Promise<ActionResult> {
  const admin = await requireRole('ADMIN')
  const parsed = updateUserSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }

  return runAction(async () => {
    const { userId, careerId, ...data } = parsed.data
    const current = await findUserForEdit(userId)
    if (!current) throw new DomainError(USER_NOT_FOUND)

    validateSelfChange(admin.id, userId, { roleChanged: current.role !== data.role, deactivating: false })
    validateRoleChange({
      current: current.role,
      next: data.role,
      headsDepartment: current.headedDepartment !== null,
      sectionCount: current._count.taughtSections,
      enrollmentCount: current._count.enrollments,
    })
    const assignedCareerId = data.role === 'STUDENT' ? careerId : null
    // A student keeps a career that was deactivated after it was assigned.
    const career = assignedCareerId ? await findCareerById(assignedCareerId) : null
    validateStudentCareer(data.role, assignedCareerId === current.careerId && career ? { active: true } : career)

    const user = await saveUser(userId, { ...data, careerId: assignedCareerId })
    if (!user) throw new DomainError(EMAIL_TAKEN_MESSAGE)
    return `Los datos de ${user.name} se guardaron.`
  }, ['/admin/users'])
}

// Activates or deactivates a user. Deactivating blocks the login and keeps the history.
export async function setUserStatus(rawUserId: string, active: boolean): Promise<ActionResult> {
  const admin = await requireRole('ADMIN')
  const parsed = userIdSchema.safeParse(rawUserId)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }

  return runAction(async () => {
    validateSelfChange(admin.id, parsed.data, { roleChanged: false, deactivating: !active })
    if (!(await findUserForEdit(parsed.data))) throw new DomainError(USER_NOT_FOUND)
    const user = await setUserActive(parsed.data, active)
    return active ? `${user.name} está activo.` : `${user.name} está inactivo y ya no puede iniciar sesión.`
  }, ['/admin/users'])
}
