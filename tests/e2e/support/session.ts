import type { Page } from '@playwright/test'
import { E2E_STUDENT } from './constants'

export async function loginAsE2EStudent(page: Page) {
  await page.goto('/login')
  await page.fill('#email', E2E_STUDENT.email)
  await page.fill('#password', E2E_STUDENT.password)
  await page.click('button[type=submit]')
  await page.waitForURL('**/student', { timeout: 60_000 })
}
