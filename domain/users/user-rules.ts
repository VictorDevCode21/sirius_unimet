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
