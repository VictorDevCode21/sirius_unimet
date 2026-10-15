// Authorization service (RBAC): maps each portal to the role allowed to use it. Edge-safe.
import type { Role } from '@/data-access/generated/prisma/enums'

export const ROLE_HOME: Record<Role, string> = {
  STUDENT: '/student',
  PROFESSOR: '/professor',
  DEPARTMENT_HEAD: '/department-head',
  ADMIN: '/admin',
}

const PORTAL_ROLES: [prefix: string, role: Role][] = [
  ['/student', 'STUDENT'],
  ['/professor', 'PROFESSOR'],
  ['/department-head', 'DEPARTMENT_HEAD'],
  ['/admin', 'ADMIN'],
]

export const PUBLIC_ROUTES = ['/login']

export function requiredRoleFor(pathname: string): Role | null {
  return PORTAL_ROLES.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`))?.[1] ?? null
}

export function authorize(role: Role | undefined, pathname: string) {
  const requiredRole = requiredRoleFor(pathname)
  return requiredRole === null || requiredRole === role
}
