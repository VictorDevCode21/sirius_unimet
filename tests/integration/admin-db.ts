import 'dotenv/config'
import { prisma } from '@/data-access/prisma'

// Integration tests run against the database in DATABASE_URL, which must be migrated and seeded (npm run db:reset).
// Import this module before any repository so the environment is loaded before the Prisma client is created.
export { prisma }

// Unique suffix so concurrent test files never collide on unique columns.
export const uniqueSuffix = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

// Term name unused by the seed, in the 9xxx range reserved for tests.
export const temporaryTermName = () => `9${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}-${1 + Math.floor(Math.random() * 3)}`
