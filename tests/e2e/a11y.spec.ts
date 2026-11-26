import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { SEED_ACCOUNTS, loginAs } from './support/accounts'
import { e2eData } from './support/data'
import { loginAsE2EStudent } from './support/session'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']
const REPORT_DIR = path.join('test-results', 'a11y')

type Account = keyof typeof SEED_ACCOUNTS

// Views audited per role. The pre-enrollment view is audited with the E2E student and one section added.
const VIEWS: { account: Account | 'e2eStudent'; paths: string[] }[] = [
  { account: 'student', paths: ['/student', '/student/flowchart', '/student/payments', '/student/enrollment', '/student/history', '/student/receipt', '/student/settings'] },
  { account: 'e2eStudent', paths: ['/student/pre-enrollment', '/student/pre-enrollment/summary'] },
  { account: 'admin', paths: ['/admin', '/admin/users', '/admin/users/new', '/admin/terms', '/admin/tuition', '/admin/departments', '/admin/careers', '/admin/curriculum', '/admin/curriculum/import', '/admin/grades'] },
  { account: 'departmentHead', paths: ['/department-head', '/department-head/sections', '/department-head/sections/new'] },
  { account: 'professor', paths: ['/professor', '/professor/sections'] },
]

// Runs axe with the WCAG 2.2 A/AA tags, saves the full report and returns the violations.
async function audit(page: Page, name: string) {
  await page.waitForLoadState('networkidle')
  // Entrance animations fade content in; measure contrast once every finite animation has ended.
  await page.waitForFunction(() =>
    document.getAnimations().every((animation) => animation.playState !== 'running' || animation.effect?.getTiming().iterations === Infinity),
  )
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  mkdirSync(REPORT_DIR, { recursive: true })
  const summary = violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    tags: violation.tags.filter((tag) => tag.startsWith('wcag')),
    nodes: violation.nodes.map((node) => ({ target: node.target.join(' '), summary: node.failureSummary })),
  }))
  writeFileSync(path.join(REPORT_DIR, `${name.replace(/[^a-z0-9]+/gi, '_')}.json`), JSON.stringify(summary, null, 2))
  for (const violation of summary) console.log(`[a11y] ${name} · ${violation.impact} · ${violation.id} (${violation.nodes.length}) · ${violation.help}`)
  return summary
}

// Audits the current page in the light theme and again in the dark theme.
async function auditBothThemes(page: Page, name: string) {
  const light = await audit(page, name)
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.reload()
  const dark = await audit(page, `${name} (dark)`)
  await page.emulateMedia({ colorScheme: 'light' })
  return [...light, ...dark]
}

const blocking = (violations: Awaited<ReturnType<typeof audit>>) =>
  violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')

test.describe('accessibility (axe, WCAG 2.2 AA)', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'audited once, on the desktop project')
  })

  test('login', async ({ page }) => {
    await page.goto('/login')
    expect(blocking(await auditBothThemes(page, '/login'))).toEqual([])
  })

  for (const { account, paths } of VIEWS) {
    test(`${account} views`, async ({ page }) => {
      if (account === 'e2eStudent') {
        e2eData('reset-selection')
        await loginAsE2EStudent(page)
      } else {
        await loginAs(page, SEED_ACCOUNTS[account])
      }
      const failures: Record<string, unknown> = {}
      for (const view of paths) {
        await page.goto(view)
        if (view === '/student/pre-enrollment') {
          await page.getByRole('button', { name: 'Agregar' }).first().click()
          await expect(page.locator('[role=status]').filter({ hasText: /agreg/i }).first()).toBeVisible()
        }
        const serious = blocking(await auditBothThemes(page, view))
        if (serious.length) failures[view] = serious
      }
      expect(failures).toEqual({})
    })
  }
})
