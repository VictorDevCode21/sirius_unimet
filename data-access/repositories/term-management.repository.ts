import { prisma } from '@/data-access/prisma'
import { isUniqueViolation } from '@/data-access/unique-violation'

export function listTerms() {
  return prisma.term.findMany({ orderBy: { startsAt: 'desc' } })
}

// Creates a closed term; returns null when the name is already taken.
export async function createTerm(data: { name: string; startsAt: Date; endsAt: Date }) {
  try {
    return await prisma.term.create({ data: { ...data, open: false } })
  } catch (error) {
    if (isUniqueViolation(error)) return null
    throw error
  }
}
