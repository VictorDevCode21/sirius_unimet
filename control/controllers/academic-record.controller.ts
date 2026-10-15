import 'server-only'
import { getStudentContext } from '@/control/controllers/student-context'
import { weightedAverage } from '@/domain/grades/academic-progress'

// Academic record controller: graded history of the student grouped by term.
export async function getAcademicRecord() {
  const { profile, grades } = await getStudentContext()

  const terms = new Map<string, { name: string; startsAt: Date; records: { code: string; name: string; credits: number; value: number; passed: boolean }[] }>()
  for (const grade of grades) {
    const term = grade.section.term
    const entry = terms.get(term.id) ?? { name: term.name, startsAt: term.startsAt, records: [] }
    entry.records.push({
      code: grade.section.subject.code,
      name: grade.section.subject.name,
      credits: grade.section.subject.credits,
      value: grade.value,
      passed: grade.status === 'PASSED',
    })
    terms.set(term.id, entry)
  }

  const history = [...terms.values()]
    .map((term) => ({
      ...term,
      credits: term.records.reduce((sum, record) => sum + record.credits, 0),
      average: weightedAverage(term.records),
    }))
    .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime())

  const graded = grades.map((grade) => ({ value: grade.value, credits: grade.section.subject.credits }))
  return { student: { name: profile.name, email: profile.email }, history, average: weightedAverage(graded) }
}
