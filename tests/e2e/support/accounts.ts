import type { Page } from '@playwright/test'

// Seeded accounts (prisma/seed.ts) used by the accessibility audit.
export const SEED_ACCOUNTS = {
  student: { email: 'r.victor@correo.unimet.edu.ve', home: '/student' },
  admin: { email: 'admin@unimet.edu.ve', home: '/admin' },
  departmentHead: { email: 'jefe.ingenieria@unimet.edu.ve', home: '/department-head' },
  professor: { email: 'profesor1@unimet.edu.ve', home: '/professor' },
} as const

export const SEED_PASSWORD = 'Test123**'

export async function loginAs(page: Page, account: { email: string; home: string }) {
  await page.goto('/login')
  await page.fill('#email', account.email)
  await page.fill('#password', SEED_PASSWORD)
  await page.click('button[type=submit]')
  await page.waitForURL(`**${account.home}`, { timeout: 60_000 })
}
