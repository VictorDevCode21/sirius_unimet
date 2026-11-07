import { expect, test, type Page } from '@playwright/test'
import { e2eData } from './support/data'
import { loginAsE2EStudent } from './support/session'

const PRE_ENROLLMENT = '/student/pre-enrollment'

const subjectCard = (page: Page, code: string) =>
  page.locator('article', { has: page.locator(`span.font-mono:text-is("${code}")`) })

test.beforeEach(async ({ page }) => {
  e2eData('reset-selection')
  await loginAsE2EStudent(page)
})

test.describe('HU-14 section offer', () => {
  test('lists sections only for available subjects with subject, credits, professor, schedule and seats', async ({ page }) => {
    await page.goto(PRE_ENROLLMENT)
    const card = subjectCard(page, 'FPTEN23')
    await expect(card.getByRole('heading', { name: 'Sistemas de Redes' })).toBeVisible()
    await expect(card).toContainText('3 UC')
    const firstSection = card.locator('li').first()
    await expect(firstSection).toContainText('Sección 1')
    await expect(firstSection).toContainText('Carlos Díaz')
    await expect(firstSection).toContainText('Lun/Mié 14:00–15:30')
    await expect(firstSection).toContainText(/\d+ cupos/)

    await page.getByRole('button', { name: 'No disponibles' }).click()
    await expect(page.locator('article').first()).toBeVisible()
    await expect(page.locator('article li')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Agregar' })).toHaveCount(0)
  })

  test('marks a section without seats as full and does not let it be selected', async ({ page }) => {
    e2eData('fill-section', 'FPTSP27', '2')
    try {
      await page.goto(PRE_ENROLLMENT)
      const fullSection = subjectCard(page, 'FPTSP27').locator('li', { hasText: 'Sección 2' })
      await expect(fullSection).toContainText('Llena')
      await expect(fullSection.getByRole('button', { name: 'Llena' })).toBeDisabled()
      await expect(fullSection).toContainText('Sección llena: no quedan cupos.')
    } finally {
      e2eData('restore-section', 'FPTSP27', '2')
    }
  })

  test('shows that enrollment is closed with the next term dates when no term is open', async ({ page }) => {
    e2eData('close-term')
    try {
      await page.goto(PRE_ENROLLMENT)
      await expect(page.getByRole('heading', { name: 'La inscripción no está abierta' })).toBeVisible()
      await expect(page.getByText('El período 2627-2 va del 8 de enero de 2027 al 5 de abril de 2027.', { exact: false })).toBeVisible()
    } finally {
      e2eData('open-term')
    }
  })
})

const selectionPanel = (page: Page) => page.locator('aside.surface')
const weeklySchedule = (page: Page) => page.locator('section[aria-label="Horario semanal de tu selección"]')
const toast = (page: Page) => page.locator('[role=status]').filter({ hasText: /\S/ }).last()

async function addSection(page: Page, code: string, number: number) {
  await subjectCard(page, code).locator('li', { hasText: `Sección ${number}` }).getByRole('button', { name: 'Agregar' }).click()
  await expect(toast(page)).toContainText('se agregó a tu pre-inscripción')
}

test.describe('HU-15A add sections', () => {
  test('an added section appears in the selection and in the weekly schedule', async ({ page }) => {
    await page.goto(PRE_ENROLLMENT)
    await addSection(page, 'FPTEN23', 1)
    await expect(selectionPanel(page).locator('li', { hasText: 'Sistemas de Redes' })).toContainText('Secc. 1')
    await expect(weeklySchedule(page).locator('[title^="Sistemas de Redes"]')).toHaveCount(2)
  })

  test('replaces the selected section of the same subject in one action', async ({ page }) => {
    await page.goto(PRE_ENROLLMENT)
    await addSection(page, 'FPTEN23', 1)
    const otherSection = subjectCard(page, 'FPTEN23').locator('li', { hasText: 'Sección 2' })
    await expect(otherSection).toContainText('Ya tienes la sección 1 de esta materia.')
    await otherSection.getByRole('button', { name: 'Reemplazar' }).click()
    const notice = otherSection.getByRole('group', { name: 'Confirmar reemplazo' })
    await expect(notice).toContainText('¿Quieres reemplazarla por la sección 2?')
    await notice.getByRole('button', { name: 'Reemplazar' }).click()
    await expect(toast(page)).toContainText('Reemplazaste la sección 1 de Sistemas de Redes por la sección 2.')
    await expect(selectionPanel(page).locator('li', { hasText: 'Sistemas de Redes' })).toHaveCount(1)
    await expect(selectionPanel(page).locator('li', { hasText: 'Sistemas de Redes' })).toContainText('Secc. 2')
  })
})
