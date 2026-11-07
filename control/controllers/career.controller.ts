'use server'

import { requireRole } from '@/control/auth/session'
import { runAction, type ActionResult } from '@/control/controllers/action-result'
import { careerIdSchema, createCareerSchema } from '@/control/validation/career.schema'
import {
  createCareer as insertCareer,
  deleteCareerIfUnused,
  departmentExists,
  findCareerUsage,
  setCareerActive,
} from '@/data-access/repositories/career-management.repository'
import { CAREER_IN_USE_MESSAGE, CAREER_TAKEN_MESSAGE, canDeleteCareer } from '@/domain/careers/career-rules'
import { DomainError } from '@/domain/shared/domain-error'

const CAREER_NOT_FOUND = 'La carrera no existe. Recarga la página.'
const CAREERS_PATHS = ['/admin/careers', '/admin/users']

// Creates a career, available from then on to assign students and subjects.
export async function createCareer(input: { name: string; departmentId: string }): Promise<ActionResult> {
  await requireRole('ADMIN')
  const parsed = createCareerSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }

  return runAction(async () => {
    if (!(await departmentExists(parsed.data.departmentId))) throw new DomainError('Selecciona un departamento.')
    const career = await insertCareer(parsed.data)
    if (!career) throw new DomainError(CAREER_TAKEN_MESSAGE)
    return `La carrera ${career.name} se creó.`
  }, CAREERS_PATHS)
}

// Deletes an unused career. A career in use is kept, and `canDeactivate` tells the UI to offer deactivation.
export async function deleteCareer(rawCareerId: string): Promise<ActionResult & { canDeactivate?: boolean }> {
  await requireRole('ADMIN')
  const parsed = careerIdSchema.safeParse(rawCareerId)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }

  let canDeactivate = false
  const result = await runAction(async () => {
    const deletion = await deleteCareerIfUnused(parsed.data, canDeleteCareer)
    if (deletion.outcome === 'missing') throw new DomainError(CAREER_NOT_FOUND)
    if (deletion.outcome === 'in-use') {
      canDeactivate = deletion.active
      throw new DomainError(CAREER_IN_USE_MESSAGE)
    }
    return `La carrera ${deletion.name} se eliminó.`
  }, CAREERS_PATHS)
  return { ...result, canDeactivate }
}

// Activates or deactivates a career. An inactive career cannot be assigned to new students.
export async function setCareerStatus(rawCareerId: string, active: boolean): Promise<ActionResult> {
  await requireRole('ADMIN')
  const parsed = careerIdSchema.safeParse(rawCareerId)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }

  return runAction(async () => {
    if (!(await findCareerUsage(parsed.data))) throw new DomainError(CAREER_NOT_FOUND)
    const career = await setCareerActive(parsed.data, active)
    return active ? `La carrera ${career.name} está activa.` : `La carrera ${career.name} está inactiva.`
  }, CAREERS_PATHS)
}
