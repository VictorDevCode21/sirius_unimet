import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import type { ReceiptView } from '@/control/controllers/receipt.controller'
import { formatCurrency, formatSchedule, formatShortDate } from '@/presentation/lib/format'

const BLUE = rgb(0, 48 / 255, 135 / 255)
const ORANGE = rgb(246 / 255, 134 / 255, 41 / 255)
const INK = rgb(0, 20 / 255, 61 / 255)
const MUTED = rgb(72 / 255, 97 / 255, 126 / 255)
const LINE = rgb(225 / 255, 230 / 255, 240 / 255)
const PAGE = { width: 595.28, height: 841.89, margin: 48 }

// Replaces characters the standard PDF fonts cannot encode.
function safeText(font: PDFFont, text: string) {
  return [...text]
    .map((char) => {
      try {
        font.encodeText(char)
        return char
      } catch {
        return '?'
      }
    })
    .join('')
}

// Splits text into lines that fit the given width.
function wrap(font: PDFFont, text: string, size: number, width: number) {
  const lines: string[] = []
  let line = ''
  for (const word of safeText(font, text).split(' ')) {
    const candidate = line ? `${line} ${word}` : word
    if (font.widthOfTextAtSize(candidate, size) <= width || !line) line = candidate
    else {
      lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  return lines
}

interface Fonts {
  regular: PDFFont
  bold: PDFFont
}

function text(page: PDFPage, font: PDFFont, value: string, x: number, y: number, size: number, color = INK) {
  page.drawText(safeText(font, value), { x, y, size, font, color })
}

// Builds the enrollment receipt PDF with student, sections, credits, amount and the simulated payment seal.
export async function buildReceiptPdf(receipt: ReceiptView, issuedAt = new Date()) {
  const pdf = await PDFDocument.create()
  pdf.setTitle(`Comprobante de inscripción ${receipt.term}`)
  pdf.setAuthor('Sirius UNIMET')
  pdf.setSubject(`Inscripción de ${receipt.student.name} en el período ${receipt.term}`)
  pdf.setCreationDate(issuedAt)
  const fonts: Fonts = { regular: await pdf.embedFont(StandardFonts.Helvetica), bold: await pdf.embedFont(StandardFonts.HelveticaBold) }

  let page = pdf.addPage([PAGE.width, PAGE.height])
  const contentWidth = PAGE.width - PAGE.margin * 2

  page.drawRectangle({ x: 0, y: PAGE.height - 92, width: PAGE.width, height: 92, color: BLUE })
  page.drawRectangle({ x: 0, y: PAGE.height - 96, width: PAGE.width, height: 4, color: ORANGE })
  text(page, fonts.bold, 'UNIVERSIDAD METROPOLITANA', PAGE.margin, PAGE.height - 48, 16, rgb(1, 1, 1))
  text(page, fonts.regular, 'Sirius UNIMET · Inscripciones', PAGE.margin, PAGE.height - 68, 10, rgb(1, 1, 1))
  const termLabel = `PERÍODO ${receipt.term}`
  text(page, fonts.bold, termLabel, PAGE.width - PAGE.margin - fonts.bold.widthOfTextAtSize(termLabel, 11), PAGE.height - 52, 11, rgb(1, 1, 1))

  let y = PAGE.height - 140
  text(page, fonts.bold, 'COMPROBANTE DE INSCRIPCIÓN', PAGE.margin, y, 20, BLUE)
  y -= 26
  for (const line of wrap(
    fonts.regular,
    `Se certifica que ${receipt.student.name} (${receipt.student.email}) se encuentra inscrito como estudiante de ${receipt.student.career} en el período ${receipt.term}, con las secciones que se detallan a continuación.`,
    10,
    contentWidth,
  )) {
    text(page, fonts.regular, line, PAGE.margin, y, 10, MUTED)
    y -= 14
  }

  const columns = [
    { label: 'CÓDIGO', x: PAGE.margin, width: 62 },
    { label: 'MATERIA', x: PAGE.margin + 66, width: 170 },
    { label: 'SECC.', x: PAGE.margin + 240, width: 32 },
    { label: 'HORARIO', x: PAGE.margin + 276, width: 190 },
    { label: 'UC', x: PAGE.margin + 470, width: 29 },
  ]
  const drawHeader = () => {
    y -= 18
    page.drawRectangle({ x: PAGE.margin, y: y - 6, width: contentWidth, height: 20, color: rgb(244 / 255, 246 / 255, 251 / 255) })
    for (const column of columns) text(page, fonts.bold, column.label, column.x + 4, y, 8, MUTED)
    y -= 18
  }
  drawHeader()

  for (const section of receipt.sections) {
    const nameLines = wrap(fonts.regular, section.subject.name, 9, columns[1].width - 6)
    const scheduleLines = wrap(fonts.regular, formatSchedule(section.blocks) || 'Sin horario', 9, columns[3].width - 6)
    const rowHeight = Math.max(nameLines.length, scheduleLines.length) * 12 + 8
    if (y - rowHeight < 190) {
      page = pdf.addPage([PAGE.width, PAGE.height])
      y = PAGE.height - PAGE.margin
      drawHeader()
    }
    text(page, fonts.bold, section.subject.code, columns[0].x + 4, y, 9)
    nameLines.forEach((line, index) => text(page, fonts.regular, line, columns[1].x + 4, y - index * 12, 9))
    text(page, fonts.regular, String(section.number), columns[2].x + 4, y, 9)
    scheduleLines.forEach((line, index) => text(page, fonts.regular, line, columns[3].x + 4, y - index * 12, 9))
    text(page, fonts.bold, String(section.subject.credits), columns[4].x + 4, y, 9)
    y -= rowHeight
    page.drawLine({ start: { x: PAGE.margin, y: y + 8 }, end: { x: PAGE.width - PAGE.margin, y: y + 8 }, thickness: 0.6, color: LINE })
  }

  y -= 8
  text(page, fonts.bold, `Total de unidades de crédito: ${receipt.totalCredits} UC`, PAGE.margin, y, 10)
  const amountLabel = `Monto pagado: ${formatCurrency(receipt.amount)}`
  text(page, fonts.bold, amountLabel, PAGE.width - PAGE.margin - fonts.bold.widthOfTextAtSize(safeText(fonts.bold, amountLabel), 12), y, 12, BLUE)

  y -= 40
  const sealHeight = 76
  page.drawRectangle({ x: PAGE.margin, y: y - sealHeight + 14, width: contentWidth, height: sealHeight, borderColor: ORANGE, borderWidth: 2, color: rgb(1, 247 / 255, 238 / 255) })
  text(page, fonts.bold, 'PAGO SIMULADO · APROBADO', PAGE.margin + 16, y - 6, 14, INK)
  const reference = receipt.payment ? receipt.payment.reference : 'Sin referencia registrada'
  const paidAt = receipt.payment ? formatShortDate(receipt.payment.paidAt) : '—'
  text(page, fonts.regular, `Referencia: ${reference}    ·    Fecha de pago: ${paidAt}`, PAGE.margin + 16, y - 26, 9.5, INK)
  text(page, fonts.regular, 'Pago generado por el simulador del sistema. No corresponde a un cobro real.', PAGE.margin + 16, y - 42, 8.5, MUTED)

  const footerY = 56
  page.drawLine({ start: { x: PAGE.margin, y: footerY + 16 }, end: { x: PAGE.width - PAGE.margin, y: footerY + 16 }, thickness: 0.6, color: LINE })
  text(page, fonts.regular, `Emitido el ${formatShortDate(issuedAt)}`, PAGE.margin, footerY, 8.5, MUTED)
  const office = 'Registro académico · Universidad Metropolitana'
  text(page, fonts.bold, office, PAGE.width - PAGE.margin - fonts.bold.widthOfTextAtSize(office, 8.5), footerY, 8.5, BLUE)

  return pdf.save()
}

export const receiptFileName = (term: string) => `comprobante-inscripcion-${term.replace(/[^0-9A-Za-z-]/g, '')}.pdf`
