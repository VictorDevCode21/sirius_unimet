import { expect, test, type Page } from '@playwright/test'
import { e2eData } from './support/data'
import { loginAsE2EStudent } from './support/session'

const PRE_ENROLLMENT = '/student/pre-enrollment'

const subjectCard = (page: Page, code: string) =>
  page.locator('article', { has: page.locator(`span.font-mono:text-is("${code}")`) })

const sectionRow = (page: Page, code: string, number: number) =>
  subjectCard(page, code).locator('li', { has: page.locator(`p:text-is("Sección ${number}")`) })

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
      const fullSection = sectionRow(page, 'FPTSP27', 2)
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
  await sectionRow(page, code, number).getByRole('button', { name: 'Agregar' }).click()
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
    const otherSection = sectionRow(page, 'FPTEN23', 2)
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

const seatsOf = async (page: Page, code: string, number: number) => {
  const text = await sectionRow(page, code, number).innerText()
  return Number(text.match(/(\d+) cupos/)?.[1])
}

test.describe('HU-15B remove sections and keep the pre-enrollment', () => {
  test('a removed section leaves the selection and the schedule and is offered again with its seat', async ({ page }) => {
    await page.goto(PRE_ENROLLMENT)
    const seatsBefore = await seatsOf(page, 'FPTSP27', 1)
    await addSection(page, 'FPTSP27', 1)
    // Pre-enrolling does not take a seat; only confirmed (paid) enrollments do.
    await expect.poll(() => seatsOf(page, 'FPTSP27', 1)).toBe(seatsBefore)

    await selectionPanel(page).getByRole('button', { name: 'Quitar Análisis de Datos' }).click()
    await expect(toast(page)).toContainText('se retiró de tu pre-inscripción')
    await expect(selectionPanel(page).locator('li', { hasText: 'Análisis de Datos' })).toHaveCount(0)
    await expect(weeklySchedule(page)).toHaveCount(0)
    const section = sectionRow(page, 'FPTSP27', 1)
    await expect(section.getByRole('button', { name: 'Agregar' })).toBeEnabled()
    await expect.poll(() => seatsOf(page, 'FPTSP27', 1)).toBe(seatsBefore)
  })

  test('the selection is stored on the server and survives logging out', async ({ page, browser }) => {
    await page.goto(PRE_ENROLLMENT)
    await addSection(page, 'FPTSP23', 1)
    await page.click('button[aria-haspopup="menu"]')
    await page.getByRole('menuitem', { name: 'Cerrar sesión' }).click()
    await page.waitForURL('**/login')

    const freshContext = await browser.newContext()
    const freshPage = await freshContext.newPage()
    await loginAsE2EStudent(freshPage)
    await freshPage.goto(PRE_ENROLLMENT)
    await expect(selectionPanel(freshPage).locator('li', { hasText: 'Sistemas de Apoyo' })).toContainText('Secc. 1')
    await expect(selectionPanel(freshPage)).toContainText('Pre-inscrita')
    await freshContext.close()
  })
})

test.describe('HU-16A schedule clashes and credit limit', () => {
  test('shows the clashing subject, day and time and does not let the section be added', async ({ page }) => {
    await page.goto(PRE_ENROLLMENT)
    await addSection(page, 'FGE3', 2)
    const clashing = sectionRow(page, 'FPTSP18', 1)
    await expect(clashing).toContainText('Choca con Electiva de Formación General (Vie 08:45–11:45).')
    await expect(clashing.getByRole('button', { name: 'Agregar' })).toBeDisabled()
    await expect(sectionRow(page, 'FPTSP18', 2).getByRole('button', { name: 'Agregar' })).toBeEnabled()
  })
})

const SUMMARY = '/student/pre-enrollment/summary'
const summaryRows = (page: Page) => page.getByTestId('summary-row')
const payButton = (page: Page) => page.getByRole('button', { name: 'Pagar' })

test.describe('HU-17 enrollment summary and amount', () => {
  test('lists each subject with its section, schedule and credits and charges credits × rate', async ({ page }) => {
    await page.goto(PRE_ENROLLMENT)
    await addSection(page, 'FPTEN23', 1)
    await addSection(page, 'FPTSP27', 1)
    await page.getByRole('link', { name: 'Ver resumen' }).click()
    await page.waitForURL(`**${SUMMARY}`)

    await expect(summaryRows(page)).toHaveCount(2)
    await expect(summaryRows(page).filter({ hasText: 'Sistemas de Redes' })).toContainText('Sección 1')
    await expect(summaryRows(page).filter({ hasText: 'Sistemas de Redes' })).toContainText('Lun/Mié 14:00–15:30')
    await expect(summaryRows(page).filter({ hasText: 'Sistemas de Redes' })).toContainText('3UC')
    await expect(page.getByTestId('summary-credits')).toHaveText('6 / 21')
    await expect(page.getByTestId('summary-amount')).toContainText('270,00')
  })

  test('recalculates the credits and the amount after removing a section', async ({ page }) => {
    await page.goto(PRE_ENROLLMENT)
    await addSection(page, 'FPTEN23', 1)
    await addSection(page, 'FPTSP27', 1)
    await selectionPanel(page).getByRole('button', { name: 'Quitar Análisis de Datos' }).click()
    await expect(toast(page)).toContainText('se retiró de tu pre-inscripción')
    await page.goto(SUMMARY)
    await expect(summaryRows(page)).toHaveCount(1)
    await expect(page.getByTestId('summary-credits')).toHaveText('3 / 21')
    await expect(page.getByTestId('summary-amount')).toContainText('135,00')
  })

  test('disables "Pagar" when the pre-enrollment is empty', async ({ page }) => {
    await page.goto(SUMMARY)
    await expect(page.getByText('Tu pre-inscripción está vacía.')).toBeVisible()
    await expect(payButton(page)).toBeDisabled()
  })

  test('"Pagar" checks the seats and opens the payment page', async ({ page }) => {
    await page.goto(PRE_ENROLLMENT)
    await addSection(page, 'FPTEN23', 1)
    await page.goto(SUMMARY)
    await payButton(page).click()
    await page.waitForURL('**/student/payment')
  })

  test('warns before payment when a selected section filled up and suggests another one (HU-16B)', async ({ page }) => {
    await page.goto(PRE_ENROLLMENT)
    await addSection(page, 'FPTEN23', 1)
    e2eData('fill-section', 'FPTEN23', '1')
    try {
      await page.goto(SUMMARY)
      await payButton(page).click()
      await expect(page.getByRole('alert').filter({ hasText: 'se llenó' })).toContainText(
        'La sección 1 de Sistemas de Redes se llenó. Te sugerimos la sección 2',
      )
      await expect(page).toHaveURL(new RegExp(`${SUMMARY}$`))
    } finally {
      e2eData('restore-section', 'FPTEN23', '1')
    }
  })
})
