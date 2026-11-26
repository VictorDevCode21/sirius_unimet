import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Panel de administración | Sirius UNIMET' }

export default function AdminHomePage() {
  redirect('/admin/terms')
}
