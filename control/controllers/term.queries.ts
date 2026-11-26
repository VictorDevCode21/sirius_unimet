import 'server-only'
import { requireRole } from '@/control/auth/session'
import { listTerms } from '@/data-access/repositories/term-management.repository'

// Term list of the admin portal, with decimals converted to plain numbers for the UI.
export async function getTerms() {
  await requireRole('ADMIN')
  const terms = await listTerms()
  return terms.map((term) => ({
    id: term.id,
    name: term.name,
    startsAt: term.startsAt,
    endsAt: term.endsAt,
    open: term.open,
    ratePerCredit: Number(term.ratePerCredit),
    maxCredits: term.maxCredits,
  }))
}

export type TermView = Awaited<ReturnType<typeof getTerms>>[number]
