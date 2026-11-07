import 'server-only'
import { getDepartmentHeadContext } from '@/control/controllers/department-head-context'
import {
  findDepartmentSection,
  listActiveProfessors,
  listDepartmentSections,
  listDepartmentSubjects,
  listSectionStudents,
  listTerms,
} from '@/data-access/repositories/section-management.repository'
import { computeOccupancy, summarizeOccupancy } from '@/domain/sections/occupancy'
import { isTermEditable } from '@/domain/sections/section-rules'

const toMinutes = (time: Date) => time.getUTCHours() * 60 + time.getUTCMinutes()

type ManagedSection = NonNullable<Awaited<ReturnType<typeof findDepartmentSection>>>

function toManagedSectionView(section: ManagedSection, today: Date) {
  return {
    id: section.id,
    number: section.number,
    capacity: section.capacity,
    subject: { id: section.subject.id, code: section.subject.code, name: section.subject.name, credits: section.subject.credits, career: section.subject.career.name },
    term: { id: section.term.id, name: section.term.name, editable: isTermEditable(section.term, today) },
    professor: { id: section.professor.id, name: section.professor.name },
    blocks: section.scheduleBlocks.map((block) => ({
      id: block.id,
      weekday: block.weekday,
      startMinutes: toMinutes(block.startTime),
      endMinutes: toMinutes(block.endTime),
    })),
    occupied: section._count.enrollmentDetails,
    grades: section._count.grades,
    occupancy: computeOccupancy(
      section.capacity,
      section.enrollmentDetails.map((detail) => detail.enrollment.status),
    ),
  }
}

export type ManagedSectionView = ReturnType<typeof toManagedSectionView>

function toTermOption(term: Awaited<ReturnType<typeof listTerms>>[number], today: Date) {
  return { id: term.id, name: term.name, open: term.open, editable: isTermEditable(term, today) }
}

export type TermOption = ReturnType<typeof toTermOption>

const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

// Sections of the head's department in the requested term (the open term by default), optionally filtered by
// subject name or code, with their occupancy totals.
export async function listManagedSections(requestedTermName?: string, query = '') {
  const { department } = await getDepartmentHeadContext()
  const today = new Date()
  const terms = (await listTerms()).map((term) => toTermOption(term, today))
  const empty = summarizeOccupancy([])
  if (!department) return { department: null, terms, term: null, sections: [], totals: empty }

  const term = terms.find((item) => item.name === requestedTermName) ?? terms.find((item) => item.open) ?? terms[0] ?? null
  const needle = normalize(query.trim())
  const sections = (term ? await listDepartmentSections(department.id, term.id) : [])
    .map((section) => toManagedSectionView(section, today))
    .filter((section) => !needle || normalize(`${section.subject.code} ${section.subject.name}`).includes(needle))
  return { department, terms, term, sections, totals: summarizeOccupancy(sections.map((section) => section.occupancy)) }
}

// Options for the create section form: editable terms, department subjects and active professors.
export async function getSectionFormOptions() {
  const { department } = await getDepartmentHeadContext()
  if (!department) return null
  const today = new Date()
  const [terms, subjects, professors] = await Promise.all([listTerms(), listDepartmentSubjects(department.id), listActiveProfessors()])
  return {
    department,
    terms: terms.map((term) => toTermOption(term, today)).filter((term) => term.editable),
    subjects: subjects.map((subject) => ({ id: subject.id, code: subject.code, name: subject.name, credits: subject.credits, term: subject.term, career: subject.career.name })),
    professors,
  }
}

export type SectionFormOptions = NonNullable<Awaited<ReturnType<typeof getSectionFormOptions>>>

// One section of the head's department with the options needed to edit it; null when it does not exist.
export async function getManagedSection(sectionId: string) {
  const { department } = await getDepartmentHeadContext()
  if (!department || !/^[0-9a-f-]{36}$/i.test(sectionId)) return null
  const [section, professors] = await Promise.all([findDepartmentSection(sectionId, department.id), listActiveProfessors()])
  if (!section) return null
  const students = await listSectionStudents(section.id)
  return {
    section: toManagedSectionView(section, new Date()),
    professors,
    students: students.map((detail) => ({
      id: detail.enrollment.student.id,
      name: detail.enrollment.student.name,
      email: detail.enrollment.student.email,
      career: detail.enrollment.student.career?.name ?? '—',
      status: detail.enrollment.status,
      since: detail.createdAt,
    })),
  }
}

export type ManagedSectionDetail = NonNullable<Awaited<ReturnType<typeof getManagedSection>>>
