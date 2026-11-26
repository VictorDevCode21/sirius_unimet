import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { PDFDocument } from 'pdf-lib'
import { buildReceiptPdf, receiptFileName } from '@/presentation/lib/receipt-pdf'

const receipt = {
  term: '2627-1',
  student: { name: 'Victor Rivas', email: 'r.victor@correo.unimet.edu.ve', career: 'Ingeniería en Sistemas' },
  sections: Array.from({ length: 14 }, (_, index) => ({
    id: String(index),
    number: 1,
    professor: 'María González',
    blocks: [
      { weekday: 'MON' as const, startMinutes: 420, endMinutes: 510 },
      { weekday: 'WED' as const, startMinutes: 420, endMinutes: 510 },
    ],
    subject: { code: `FBTMM0${index}`, name: index === 0 ? 'Diseño de Sistemas de Información y Programación Orientada a Objetos' : `Materia ${index}`, credits: 3 },
  })),
  totalCredits: 42,
  enrolledAt: new Date(Date.UTC(2026, 8, 1)),
}

const hasPdftotext = (() => {
  try {
    execFileSync('pdftotext', ['-v'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
})()

describe('HU-19 receipt PDF', () => {
  it('produces a valid PDF that can be opened again', async () => {
    const bytes = await buildReceiptPdf(receipt, new Date(Date.UTC(2026, 10, 4)))
    assert.equal(Buffer.from(bytes.slice(0, 5)).toString(), '%PDF-')
    const reopened = await PDFDocument.load(bytes)
    assert.ok(reopened.getPageCount() >= 1)
    assert.equal(reopened.getTitle(), 'Certificado de inscripción 2627-1')
  })

  it('certifies the enrollment: student, sections and credits, without payment data', { skip: !hasPdftotext && 'pdftotext not installed' }, async () => {
    const file = path.join(mkdtempSync(path.join(tmpdir(), 'receipt-')), 'receipt.pdf')
    writeFileSync(file, await buildReceiptPdf(receipt))
    const content = execFileSync('pdftotext', [file, '-']).toString()
    for (const expected of ['Victor Rivas', 'Ingeniería en Sistemas', 'PERÍODO 2627-1', 'FBTMM013', 'Lun/Mié 07:00–08:30', '42 UC', 'CERTIFICADO DE INSCRIPCIÓN', 'INSCRIPCIÓN CONFIRMADA']) {
      assert.ok(content.includes(expected), `missing "${expected}"`)
    }
    for (const unexpected of ['Pagado', 'SALDO', 'USD']) assert.ok(!content.includes(unexpected), `unexpected "${unexpected}"`)
  })

  it('builds a safe file name', () => {
    assert.equal(receiptFileName('2627-1'), 'certificado-inscripcion-2627-1.pdf')
    assert.equal(receiptFileName('../x"y'), 'certificado-inscripcion-xy.pdf')
  })
})
