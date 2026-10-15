import { prisma } from '@/data-access/prisma'

export function findOpenTerm() {
  return prisma.term.findFirst({ where: { open: true } })
}

// The current term is the one whose date range contains the given day.
export function findTermByDate(date: Date) {
  return prisma.term.findFirst({ where: { startsAt: { lte: date }, endsAt: { gte: date } } })
}
