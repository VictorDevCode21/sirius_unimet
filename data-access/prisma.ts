import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/data-access/generated/prisma/client'

// Reuses a single client across hot reloads in development.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export function createPrismaClient(connectionString = process.env.DATABASE_URL) {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
