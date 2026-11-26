import { expect, test, type Page } from '@playwright/test'
import { SEED_ACCOUNTS, loginAs } from './support/accounts'

// 1280 px at 200 % zoom renders like a 640 px wide viewport (WCAG 2.2, 1.4.4 and 1.4.10).
const ZOOMED_VIEWPORT = { width: 640, height: 800 }

const VIEWS: { account: keyof typeof SEED_ACCOUNTS | null; paths: string[] }[] = [
  { account: null, paths: ['/login'] },
  { account: 'student', paths: ['/student', '/student/flowchart', '/student/pre-enrollment', '/student/payments', '/student/enrollment', '/student/history', '/student/receipt', '/student/settings'] },
  { account: 'admin', paths: ['/admin/terms', '/admin/users', '/admin/tuition', '/admin/curriculum', '/admin/grades'] },
  { account: 'departmentHead', paths: ['/department-head/sections', '/department-head/sections/new'] },
  { account: 'professor', paths: ['/professor/sections'] },
]

// Width the document overflows the viewport by; the flowchart scrolls inside its own container, not the page.
const pageOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)

test.describe('reflow at 200 % zoom (640 px wide)', () => {
  test.use({ viewport: ZOOMED_VIEWPORT })
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'checked once, on the desktop project')
  })

  for (const { account, paths } of VIEWS) {
    test(`${account ?? 'public'} views do not scroll horizontally`, async ({ page }) => {
      if (account) await loginAs(page, SEED_ACCOUNTS[account])
      const overflowing: Record<string, number> = {}
      for (const path of paths) {
        await page.goto(path)
        await page.waitForLoadState('networkidle')
        const overflow = await pageOverflow(page)
        if (overflow > 0) overflowing[path] = overflow
      }
      expect(overflowing).toEqual({})
    })
  }
})
