// True when a Prisma write failed on a unique constraint (error code P2002).
export function isUniqueViolation(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002'
}
