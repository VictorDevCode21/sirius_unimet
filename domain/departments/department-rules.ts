// Department rules: unique names and who can head a department.
import { DomainError } from '@/domain/shared/domain-error'

export const DEPARTMENT_TAKEN_MESSAGE = 'Ya existe un departamento con ese nombre.'
export const HEAD_TAKEN_MESSAGE = 'Ese usuario ya dirige otro departamento.'

interface HeadCandidate {
  role: string
  active: boolean
  headedDepartmentId: string | null
}

// A head must be an active user with the department-head role who does not head another department.
export function validateDepartmentHead(candidate: HeadCandidate | null, departmentId: string) {
  if (!candidate || candidate.role !== 'DEPARTMENT_HEAD') {
    throw new DomainError('El usuario seleccionado no tiene el rol de jefe de departamento.')
  }
  if (!candidate.active) throw new DomainError('El usuario seleccionado está inactivo.')
  if (candidate.headedDepartmentId && candidate.headedDepartmentId !== departmentId) throw new DomainError(HEAD_TAKEN_MESSAGE)
}
