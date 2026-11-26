import 'server-only'
import { requireRole } from '@/control/auth/session'
import { termIdSchema } from '@/control/validation/term.schema'
import { findTermById, listTerms } from '@/data-access/repositories/term-management.repository'

type TermRecord = Awaited<ReturnType<typeof listTerms>>[number]

// Converts decimals to plain numbers for the UI.
function toTermView(term: TermRecord) {
  return {
    id: term.id,
    name: term.name,
    startsAt: term.startsAt,
    endsAt: term.endsAt,
    open: term.open,
    ratePerCredit: Number(term.ratePerCredit),
    maxCredits: term.maxCredits,
  }
}

export type TermView = ReturnType<typeof toTermView>

export async function getTerms() {
  await requireRole('ADMIN')
  return (await listTerms()).map(toTermView)
}

// Returns null when the id is malformed or the term does not exist.
export async function getTerm(rawTermId: string) {
  await requireRole('ADMIN')
  const parsed = termIdSchema.safeParse(rawTermId)
  if (!parsed.success) return null
  const term = await findTermById(parsed.data)
  return term ? toTermView(term) : null
}
