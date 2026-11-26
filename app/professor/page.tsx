import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Panel del profesor | Sirius UNIMET' }

export default function ProfessorHomePage() {
  redirect('/professor/sections')
}
