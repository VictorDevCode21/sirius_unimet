import type { UserRole } from '@/domain/users/user-rules'

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  DEPARTMENT_HEAD: 'Jefe de departamento',
  PROFESSOR: 'Profesor',
  STUDENT: 'Estudiante',
}

export const ROLE_OPTIONS = Object.entries(ROLE_LABELS) as [UserRole, string][]
