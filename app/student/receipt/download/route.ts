import { getReceiptForDownload } from '@/control/controllers/receipt.controller'
import { buildReceiptPdf, receiptFileName } from '@/presentation/lib/receipt-pdf'

const messages = {
  401: 'Inicia sesión para descargar tu comprobante.',
  403: 'Solo los estudiantes pueden descargar comprobantes de inscripción.',
  404: 'No tienes una inscripción confirmada en ese período.',
}

// Downloads the PDF receipt of the signed-in student's confirmed enrollment in the requested term.
export async function GET(request: Request) {
  const term = new URL(request.url).searchParams.get('term') ?? ''
  const result = await getReceiptForDownload(term)
  if (result.status !== 200) {
    return new Response(messages[result.status], { status: result.status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } })
  }

  const pdf = await buildReceiptPdf(result.receipt)
  return new Response(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${receiptFileName(result.receipt.term)}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
