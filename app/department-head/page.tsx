import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Panel del jefe de departamento | Sirius UNIMET' }

export default function DepartmentHeadHomePage() {
  redirect('/department-head/sections')
}
