'use server'

import { requireRole } from '@/control/auth/session'
import { runAction, type ActionResult } from '@/control/controllers/action-result'
import { assignHeadSchema, departmentNameSchema } from '@/control/validation/department.schema'
import {
  assignDepartmentHead,
  createDepartment as insertDepartment,
  findHeadCandidate,
} from '@/data-access/repositories/department-management.repository'
import { DEPARTMENT_TAKEN_MESSAGE, HEAD_TAKEN_MESSAGE, validateDepartmentHead } from '@/domain/departments/department-rules'
import { DomainError } from '@/domain/shared/domain-error'

// Creates a department, available from then on to associate careers.
export async function createDepartment(rawName: string): Promise<ActionResult> {
  await requireRole('ADMIN')
  const parsed = departmentNameSchema.safeParse(rawName)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }

  return runAction(async () => {
    const department = await insertDepartment(parsed.data)
    if (!department) throw new DomainError(DEPARTMENT_TAKEN_MESSAGE)
    return `El departamento ${department.name} se creó.`
  }, ['/admin/departments'])
}

// Assigns or removes the head of a department.
export async function assignHead(input: { departmentId: string; headId: string }): Promise<ActionResult> {
  await requireRole('ADMIN')
  const parsed = assignHeadSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }

  return runAction(async () => {
    const { departmentId, headId } = parsed.data
    if (headId) validateDepartmentHead(await findHeadCandidate(headId), departmentId)
    const department = await assignDepartmentHead(departmentId, headId)
    if (!department) throw new DomainError(HEAD_TAKEN_MESSAGE)
    return headId ? `Se asignó el jefe de ${department.name}.` : `${department.name} quedó sin jefe.`
  }, ['/admin/departments'])
}
