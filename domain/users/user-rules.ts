// User rules: career requirement of students and uniqueness of institutional emails.
import { DomainError } from '@/domain/shared/domain-error'

export type UserRole = 'ADMIN' | 'DEPARTMENT_HEAD' | 'PROFESSOR' | 'STUDENT'

export const EMAIL_TAKEN_MESSAGE = 'Este correo ya está registrado'

// Every career of the system belongs to the Engineering faculty (pilot scope), so an active career is a valid one.
export function validateStudentCareer(role: UserRole, career: { active: boolean } | null) {
  if (role !== 'STUDENT') return
  if (!career) throw new DomainError('Debes asignar una carrera de Ingeniería al estudiante.')
  if (!career.active) throw new DomainError('La carrera seleccionada está inactiva.')
}

interface RoleChange {
  current: UserRole
  next: UserRole
  headsDepartment: boolean
  sectionCount: number
  enrollmentCount: number
}

// A role cannot change while records depend on it, because they would point to a user without the matching role.
export function validateRoleChange({ current, next, headsDepartment, sectionCount, enrollmentCount }: RoleChange) {
  if (current === next) return
  if (headsDepartment) throw new DomainError('Este usuario dirige un departamento. Asigna otro jefe antes de cambiar su rol.')
  if (sectionCount > 0) throw new DomainError('Este usuario tiene secciones asignadas, por lo que no se puede cambiar su rol.')
  if (enrollmentCount > 0) throw new DomainError('Este usuario tiene inscripciones registradas, por lo que no se puede cambiar su rol.')
}

// An admin cannot remove their own access, which also guarantees that one active admin always remains.
export function validateSelfChange(actorId: string, targetId: string, change: { roleChanged: boolean; deactivating: boolean }) {
  if (actorId !== targetId) return
  if (change.roleChanged) throw new DomainError('No puedes cambiar tu propio rol.')
  if (change.deactivating) throw new DomainError('No puedes desactivar tu propia cuenta.')
}
