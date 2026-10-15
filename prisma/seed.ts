import 'dotenv/config'
import { randomBytes } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import bcrypt from 'bcryptjs'
import { prisma } from '../data-access/prisma'
import { createCurriculumRepository } from '../data-access/repositories/curriculum.repository'
import type { Weekday } from '../data-access/generated/prisma/client'
import { importCurriculum } from '../domain/curriculum/csv-importer'
import { calculateAmount } from '../domain/billing/amount-calculator'
import { resolveGradeStatus } from '../domain/grades/academic-progress'

const STUDENT_EMAIL = 'r.victor@correo.unimet.edu.ve'
const STUDENT_PASSWORD = 'Test123**'
const RATE_PER_CREDIT = 45
const MAX_CREDITS = 21

const engineeringCareers = [
  'Ingeniería Química',
  'Ingeniería Mecánica',
  'Ingeniería en Sistemas',
  'Ingeniería Eléctrica',
  'Ingeniería Civil',
  'Ingeniería en Producción',
]

const professors = [
  'María González',
  'José Rodríguez',
  'Ana Martínez',
  'Luis Pérez',
  'Carmen Hernández',
  'Carlos Díaz',
  'Gabriela Torres',
]

// Trimester 1 runs Sep–Dec, trimester 2 Jan–Apr, trimester 3 Apr–Jul.
function buildTerm(startYear: number, trimester: number, open = false) {
  const name = `${String(startYear).slice(2)}${String(startYear + 1).slice(2)}-${trimester}`
  const ranges: Record<number, [Date, Date]> = {
    1: [new Date(Date.UTC(startYear, 8, 15)), new Date(Date.UTC(startYear, 11, 15))],
    2: [new Date(Date.UTC(startYear + 1, 0, 8)), new Date(Date.UTC(startYear + 1, 3, 5))],
    3: [new Date(Date.UTC(startYear + 1, 3, 20)), new Date(Date.UTC(startYear + 1, 6, 20))],
  }
  const [startsAt, endsAt] = ranges[trimester]
  return { name, startsAt, endsAt, open, ratePerCredit: RATE_PER_CREDIT, maxCredits: MAX_CREDITS }
}

const terms = [
  buildTerm(2023, 2),
  buildTerm(2023, 3),
  buildTerm(2024, 1),
  buildTerm(2024, 2),
  buildTerm(2024, 3),
  buildTerm(2025, 1),
  buildTerm(2025, 2),
  buildTerm(2025, 3),
  buildTerm(2026, 1),
  buildTerm(2026, 2, true),
]

// Term in which the sample student took each flowchart term; the last one is in progress.
const studentTermByCurriculumTerm: Record<number, string> = {
  1: '2324-2',
  2: '2324-3',
  3: '2425-1',
  4: '2425-2',
  5: '2425-3',
  6: '2526-1',
  7: '2526-2',
  8: '2627-1',
}
const CURRENT_TERM = '2627-1'
const OPEN_TERM = '2627-2'

// Flowchart columns offered in trimester 2, used to build the open term offer.
const curriculumTermsOfferedInTrimesterTwo = [1, 2, 4, 5, 7, 8, 10, 11]

// Weekly slots: Mon/Wed and Tue/Thu pairs of 90 minutes, or a single 180-minute block on Friday.
const dayPatterns: { days: Weekday[]; minutes: number }[] = [
  { days: ['MON', 'WED'], minutes: 90 },
  { days: ['TUE', 'THU'], minutes: 90 },
  { days: ['FRI'], minutes: 180 },
]
const startMinutes = [7 * 60, 8 * 60 + 45, 10 * 60 + 30, 12 * 60 + 15, 14 * 60, 15 * 60 + 45]

const timeOf = (minutes: number) => new Date(Date.UTC(1970, 0, 1, Math.floor(minutes / 60), minutes % 60))

// Professor index and slot index cycle with coprime lengths, so a professor never repeats a slot within a term.
function scheduleFor(sectionIndex: number) {
  const slot = sectionIndex % (dayPatterns.length * startMinutes.length)
  const pattern = dayPatterns[Math.floor(slot / startMinutes.length)]
  const start = startMinutes[slot % startMinutes.length]
  const end = pattern.minutes === 180 ? start + 180 : start + 90
  return {
    professorIndex: sectionIndex % professors.length,
    blocks: pattern.days.map((weekday) => ({ weekday, startTime: timeOf(start), endTime: timeOf(end) })),
  }
}

function sampleGrade(code: string, term: number) {
  const hash = [...code].reduce((acc, char) => acc + char.charCodeAt(0), term * 7)
  return 13 + (hash % 7)
}

async function reset() {
  await prisma.simulatedPayment.deleteMany()
  await prisma.grade.deleteMany()
  await prisma.enrollmentDetail.deleteMany()
  await prisma.enrollment.deleteMany()
  await prisma.scheduleBlock.deleteMany()
  await prisma.section.deleteMany()
}

async function seedAcademicStructure() {
  const department = await prisma.department.upsert({
    where: { name: 'Ingeniería' },
    update: {},
    create: { name: 'Ingeniería' },
  })
  for (const name of engineeringCareers) {
    await prisma.career.upsert({ where: { name }, update: { departmentId: department.id }, create: { name, departmentId: department.id } })
  }
  for (const term of terms) {
    await prisma.term.upsert({ where: { name: term.name }, update: term, create: term })
  }
}

async function seedSystemsCurriculum() {
  const career = await prisma.career.findUniqueOrThrow({ where: { name: 'Ingeniería en Sistemas' } })
  const csv = await readFile(path.join(__dirname, 'data', 'systems-engineering-curriculum.csv'), 'utf8')
  const result = await importCurriculum(career.id, csv, createCurriculumRepository(prisma))
  if (!result.ok) throw new Error(`Curriculum import failed:\n${result.errors.join('\n')}`)
  console.log(`Curriculum imported: ${result.subjects} subjects, ${result.prerequisites} prerequisites`)
  return career
}

async function seedUsers(careerId: string) {
  const professorIds: string[] = []
  for (const [index, name] of professors.entries()) {
    const email = `profesor${index + 1}@unimet.edu.ve`
    // Professors get an unusable random password until their portal exists.
    const passwordHash = await bcrypt.hash(randomBytes(24).toString('hex'), 10)
    const professor = await prisma.user.upsert({
      where: { email },
      update: { name, role: 'PROFESSOR' },
      create: { email, name, passwordHash, role: 'PROFESSOR' },
    })
    professorIds.push(professor.id)
  }

  const student = await prisma.user.upsert({
    where: { email: STUDENT_EMAIL },
    update: { passwordHash: await bcrypt.hash(STUDENT_PASSWORD, 12), role: 'STUDENT', careerId, active: true },
    create: {
      email: STUDENT_EMAIL,
      name: 'Victor Rivas',
      passwordHash: await bcrypt.hash(STUDENT_PASSWORD, 12),
      role: 'STUDENT',
      careerId,
    },
  })

  return { professorIds, studentId: student.id }
}

async function createSection(params: { subjectId: string; termId: string; number: number; index: number; professorIds: string[]; capacity?: number }) {
  const schedule = scheduleFor(params.index)
  return prisma.section.create({
    data: {
      subjectId: params.subjectId,
      termId: params.termId,
      number: params.number,
      capacity: params.capacity ?? 30,
      professorId: params.professorIds[schedule.professorIndex],
      scheduleBlocks: { create: schedule.blocks },
    },
  })
}

async function seedStudentHistory(careerId: string, studentId: string, professorIds: string[]) {
  const subjects = await prisma.subject.findMany({ where: { careerId } })
  const termByName = new Map((await prisma.term.findMany()).map((term) => [term.name, term]))

  for (const [curriculumTerm, termName] of Object.entries(studentTermByCurriculumTerm)) {
    const term = termByName.get(termName)!
    const termSubjects = subjects.filter((subject) => subject.term === Number(curriculumTerm))
    const sections = []
    for (const [index, subject] of termSubjects.entries()) {
      sections.push({ section: await createSection({ subjectId: subject.id, termId: term.id, number: 1, index, professorIds }), subject })
    }

    const totalCredits = termSubjects.reduce((sum, subject) => sum + subject.credits, 0)
    const amount = calculateAmount(totalCredits, Number(term.ratePerCredit))
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        termId: term.id,
        status: 'CONFIRMED',
        amount,
        details: { create: sections.map(({ section }) => ({ sectionId: section.id })) },
        payments: { create: { reference: `SIM-${termName}-${studentId.slice(0, 8)}`.toUpperCase(), amount, status: 'APPROVED' } },
      },
    })

    if (termName === CURRENT_TERM) continue
    for (const { section, subject } of sections) {
      const value = sampleGrade(subject.code, subject.term)
      await prisma.grade.create({
        data: { sectionId: section.id, studentId: enrollment.studentId, value, status: resolveGradeStatus(value), published: true },
      })
    }
  }
}

async function seedOpenTermOffer(careerId: string, professorIds: string[]) {
  const term = await prisma.term.findUniqueOrThrow({ where: { name: OPEN_TERM } })
  const subjects = await prisma.subject.findMany({
    where: { careerId, term: { in: curriculumTermsOfferedInTrimesterTwo } },
    orderBy: [{ term: 'asc' }, { branch: 'asc' }],
  })

  let index = 0
  for (const subject of subjects) {
    const sectionCount = subject.term >= 7 ? 2 : 1
    for (let number = 1; number <= sectionCount; number++) {
      await createSection({ subjectId: subject.id, termId: term.id, number, index: index++, professorIds })
    }
  }
  console.log(`Open term ${OPEN_TERM}: ${index} sections`)
}

async function main() {
  await reset()
  await seedAcademicStructure()
  const career = await seedSystemsCurriculum()
  const { professorIds, studentId } = await seedUsers(career.id)
  await seedStudentHistory(career.id, studentId, professorIds)
  await seedOpenTermOffer(career.id, professorIds)
  console.log('Seed completed')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
