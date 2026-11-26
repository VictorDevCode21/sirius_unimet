import 'dotenv/config'
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
const DEPARTMENT_HEAD_EMAIL = 'jefe.ingenieria@unimet.edu.ve'
const DEPARTMENT_HEAD_PASSWORD = 'Test123**'
const ADMIN_EMAIL = 'admin@unimet.edu.ve'
const ADMIN_PASSWORD = 'Test123**'
const UNASSIGNED_HEAD_EMAIL = 'jefe.disponible@unimet.edu.ve'
const UNCONFIGURED_TERM = { name: '2627-3', startsAt: new Date(Date.UTC(2027, 3, 20)), endsAt: new Date(Date.UTC(2027, 6, 20)) }
const SAMPLE_PASSWORD = 'Test123**'
const SAMPLE_PROFESSOR_EMAIL = 'profesor1@unimet.edu.ve'
const PROFESSOR_WITHOUT_SECTIONS_EMAIL = 'sin.secciones@unimet.edu.ve'
const sampleClassmates = ['Andrea Blanco', 'Diego Fuentes', 'Sofía Navarro']
const FINISHED_TERM = '2526-2'
const samplePublishedGrades = [15, 8]
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
  buildTerm(2022, 1),
  buildTerm(2022, 2),
  buildTerm(2022, 3),
  buildTerm(2023, 1),
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
    const passwordHash = await bcrypt.hash(SAMPLE_PASSWORD, 10)
    const professor = await prisma.user.upsert({
      where: { email },
      update: { name, role: 'PROFESSOR', passwordHash },
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

// Sample head of the Ingeniería department, used by the section management portal.
async function seedDepartmentHead() {
  const passwordHash = await bcrypt.hash(DEPARTMENT_HEAD_PASSWORD, 12)
  const head = await prisma.user.upsert({
    where: { email: DEPARTMENT_HEAD_EMAIL },
    update: { passwordHash, role: 'DEPARTMENT_HEAD', active: true },
    create: { email: DEPARTMENT_HEAD_EMAIL, name: 'Laura Mendoza', passwordHash, role: 'DEPARTMENT_HEAD' },
  })
  await prisma.department.update({ where: { name: 'Ingeniería' }, data: { headId: head.id } })
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

// Sample admin account, a closed and not yet configured period, and a department head without a department.
async function seedAdminConfig() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { passwordHash, role: 'ADMIN', active: true },
    create: { email: ADMIN_EMAIL, name: 'Administración UNIMET', passwordHash, role: 'ADMIN' },
  })
  await prisma.term.upsert({
    where: { name: UNCONFIGURED_TERM.name },
    update: {},
    create: UNCONFIGURED_TERM,
  })
  await prisma.user.upsert({
    where: { email: UNASSIGNED_HEAD_EMAIL },
    update: { passwordHash, role: 'DEPARTMENT_HEAD', active: true },
    create: { email: UNASSIGNED_HEAD_EMAIL, name: 'Andrés Salazar', passwordHash, role: 'DEPARTMENT_HEAD' },
  })
}

// Sample professor with a login and students in the current term, plus a professor without sections.
async function seedProfessorSections() {
  const passwordHash = await bcrypt.hash(SAMPLE_PASSWORD, 12)
  const professor = await prisma.user.update({ where: { email: SAMPLE_PROFESSOR_EMAIL }, data: { passwordHash } })
  await prisma.user.upsert({
    where: { email: PROFESSOR_WITHOUT_SECTIONS_EMAIL },
    update: { passwordHash, role: 'PROFESSOR', active: true },
    create: { email: PROFESSOR_WITHOUT_SECTIONS_EMAIL, name: 'Elena Suárez', passwordHash, role: 'PROFESSOR' },
  })

  const term = await prisma.term.findUniqueOrThrow({ where: { name: CURRENT_TERM } })
  const career = await prisma.career.findUniqueOrThrow({ where: { name: 'Ingeniería en Sistemas' } })
  const section = await prisma.section.findFirstOrThrow({
    where: { termId: term.id, professorId: professor.id },
    include: { subject: true },
    orderBy: { subject: { code: 'asc' } },
  })
  const amount = calculateAmount(section.subject.credits, Number(term.ratePerCredit))

  for (const [index, name] of sampleClassmates.entries()) {
    const email = `estudiante${index + 1}@correo.unimet.edu.ve`
    const student = await prisma.user.upsert({
      where: { email },
      update: { name, passwordHash, role: 'STUDENT', careerId: career.id, active: true },
      create: { email, name, passwordHash, role: 'STUDENT', careerId: career.id },
    })
    await prisma.enrollment.create({
      data: {
        studentId: student.id,
        termId: term.id,
        status: 'CONFIRMED',
        amount,
        details: { create: { sectionId: section.id } },
        payments: { create: { reference: `SIM-${CURRENT_TERM}-${student.id.slice(0, 8)}`.toUpperCase(), amount, status: 'APPROVED' } },
      },
    })
  }
}

// Published passing and failing grades in a finished term, to show Aprobada and Reprobada and the admin correction.
async function seedPublishedGrades() {
  const term = await prisma.term.findUniqueOrThrow({ where: { name: FINISHED_TERM } })
  const professor = await prisma.user.findUniqueOrThrow({ where: { email: SAMPLE_PROFESSOR_EMAIL } })
  const section = await prisma.section.findFirstOrThrow({
    where: { termId: term.id, professorId: professor.id },
    include: { subject: true },
    orderBy: { subject: { code: 'asc' } },
  })
  const amount = calculateAmount(section.subject.credits, Number(term.ratePerCredit))

  for (const [index, value] of samplePublishedGrades.entries()) {
    const student = await prisma.user.findUniqueOrThrow({ where: { email: `estudiante${index + 1}@correo.unimet.edu.ve` } })
    await prisma.enrollment.create({
      data: { studentId: student.id, termId: term.id, status: 'CONFIRMED', amount, details: { create: { sectionId: section.id } } },
    })
    await prisma.grade.create({
      data: { sectionId: section.id, studentId: student.id, value, status: resolveGradeStatus(value), published: true },
    })
  }
}

const cohortFirstNames = ['Valentina', 'Santiago', 'Camila', 'Sebastián', 'Isabella', 'Mateo', 'Lucía', 'Diego', 'Mariana', 'Daniel', 'Paula', 'Andrés', 'Gabriela', 'Alejandro', 'Daniela']
const cohortLastNames = ['Ramírez', 'Morales', 'Castillo', 'Rojas', 'Mendoza', 'Silva', 'Vargas', 'Herrera', 'Medina', 'Guerrero', 'Ortiz', 'Romero', 'Paredes', 'Acosta', 'Rivero']
const COHORT_SIZE = 30
const CURRICULUM_LENGTH = 12

// Deterministic pseudo-random number in [0, 1) so every seed run builds the same sample data.
function seeded(...parts: (string | number)[]) {
  const hash = parts.join('|').split('').reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 7)
  return (hash % 10_000) / 10_000
}

/**
 * Sample students of several cohorts in Ingeniería en Sistemas (alumno01…alumno30@correo.unimet.edu.ve, password
 * Test123**). Each one takes one flowchart term per trimester from its starting term:
 * - finished terms get published grades; about a third fail one subject in their last finished term;
 * - students without a failed subject are enrolled and paid in the current term (grades not published yet);
 * - students with a failed subject skip the current term and pre-enroll in the open term to retake it, some with a
 *   rejected payment (PENDING). Unpaid enrollments never take seats, so the open term offer keeps its seats.
 */
async function seedSampleCohorts(careerId: string, professorIds: string[]) {
  const passwordHash = await bcrypt.hash(SAMPLE_PASSWORD, 10)
  const subjects = await prisma.subject.findMany({ where: { careerId }, orderBy: [{ term: 'asc' }, { branch: 'asc' }] })
  const allTerms = await prisma.term.findMany({ orderBy: { startsAt: 'asc' } })
  const currentIndex = allTerms.findIndex((term) => term.name === CURRENT_TERM)
  const finished = allTerms.slice(0, currentIndex)
  const currentTerm = allTerms[currentIndex]
  const openTerm = allTerms.find((term) => term.name === OPEN_TERM)!

  // One section per subject and term, created on first use with a professor and slot that do not clash with the
  // professor's other sections of the term.
  const busyByTerm = new Map<string, { professorId: string; weekday: string; start: number; end: number }[]>()
  const sectionCache = new Map<string, { id: string }>()
  const minutesOf = (time: Date) => time.getUTCHours() * 60 + time.getUTCMinutes()
  async function busySlots(termId: string) {
    let busy = busyByTerm.get(termId)
    if (!busy) {
      const blocks = await prisma.scheduleBlock.findMany({ where: { section: { termId } }, include: { section: { select: { professorId: true } } } })
      busy = blocks.map((block) => ({ professorId: block.section.professorId, weekday: block.weekday, start: minutesOf(block.startTime), end: minutesOf(block.endTime) }))
      busyByTerm.set(termId, busy)
    }
    return busy
  }
  async function sectionFor(subjectId: string, termId: string) {
    const key = `${subjectId}:${termId}`
    const cached = sectionCache.get(key)
    if (cached) return cached
    let section: { id: string } | null = await prisma.section.findFirst({ where: { subjectId, termId }, orderBy: { number: 'asc' } })
    if (!section) {
      const busy = await busySlots(termId)
      let index = 0
      for (; ; index++) {
        const { professorIndex, blocks } = scheduleFor(index)
        const professorId = professorIds[professorIndex]
        const clashes = blocks.some((block) =>
          busy.some(
            (other) =>
              other.professorId === professorId && other.weekday === block.weekday && other.start < minutesOf(block.endTime) && minutesOf(block.startTime) < other.end,
          ),
        )
        if (!clashes) {
          busy.push(...blocks.map((block) => ({ professorId, weekday: block.weekday, start: minutesOf(block.startTime), end: minutesOf(block.endTime) })))
          break
        }
      }
      section = await createSection({ subjectId, termId, number: 1, index, professorIds })
    }
    sectionCache.set(key, section)
    return section
  }

  async function enroll(studentId: string, term: (typeof allTerms)[number], subjectIds: string[], status: 'CONFIRMED' | 'PRE_ENROLLED' | 'PENDING') {
    const chosen = subjects.filter((subject) => subjectIds.includes(subject.id))
    const sections: { id: string }[] = []
    for (const subject of chosen) sections.push(await sectionFor(subject.id, term.id))
    const amount = calculateAmount(chosen.reduce((sum, subject) => sum + subject.credits, 0), Number(term.ratePerCredit))
    const reference = `SIM-${term.name}-${studentId.slice(0, 8)}`.toUpperCase()
    const payments =
      status === 'CONFIRMED'
        ? { create: { reference, amount, status: 'APPROVED' as const } }
        : status === 'PENDING'
          ? { create: { reference: `${reference}-R`, amount, status: 'REJECTED' as const } }
          : undefined
    await prisma.enrollment.create({
      data: { studentId, termId: term.id, status, amount, details: { create: sections.map((section) => ({ sectionId: section.id })) }, payments },
    })
    return chosen.map((subject, index) => ({ subject, section: sections[index] }))
  }

  const summary = { students: 0, graduated: 0, current: 0, retaking: 0, grades: 0 }
  for (let index = 0; index < COHORT_SIZE; index++) {
    const name = `${cohortFirstNames[index % cohortFirstNames.length]} ${cohortLastNames[(index * 7) % cohortLastNames.length]}`
    const email = `alumno${String(index + 1).padStart(2, '0')}@correo.unimet.edu.ve`
    const student = await prisma.user.upsert({
      where: { email },
      update: { name, passwordHash, role: 'STUDENT', careerId, active: true },
      create: { email, name, passwordHash, role: 'STUDENT', careerId },
    })
    summary.students++

    // Starting terms spread over every finished term, so the cohorts are at different points of the flowchart.
    const start = index % finished.length
    const takenTerms = finished.slice(start, start + CURRICULUM_LENGTH)
    const fails = seeded(email, 'fail') < 0.34
    let failedSubjectId: string | null = null

    for (const [offset, term] of takenTerms.entries()) {
      const curriculumTerm = offset + 1
      const termSubjects = subjects.filter((subject) => subject.term === curriculumTerm)
      const taken = await enroll(student.id, term, termSubjects.map((subject) => subject.id), 'CONFIRMED')
      const isLast = offset === takenTerms.length - 1
      const failIndex = fails && isLast ? Math.floor(seeded(email, term.name) * taken.length) : -1
      for (const [position, { subject, section }] of taken.entries()) {
        const value = position === failIndex ? 5 + Math.floor(seeded(email, subject.code) * 5) : 10 + Math.floor(seeded(email, subject.code) * 11)
        if (position === failIndex) failedSubjectId = subject.id
        await prisma.grade.create({ data: { sectionId: section.id, studentId: student.id, value, status: resolveGradeStatus(value), published: true } })
        summary.grades++
      }
    }

    const reached = takenTerms.length
    if (reached >= CURRICULUM_LENGTH && !failedSubjectId) {
      summary.graduated++
    } else if (!failedSubjectId) {
      await enroll(student.id, currentTerm, subjects.filter((subject) => subject.term === reached + 1).map((subject) => subject.id), 'CONFIRMED')
      summary.current++
    } else {
      const failed = subjects.find((subject) => subject.id === failedSubjectId)!
      const offered = await prisma.section.findFirst({ where: { termId: openTerm.id, subjectId: failed.id } })
      if (offered) {
        await enroll(student.id, openTerm, [failed.id], seeded(email, 'pending') < 0.5 ? 'PENDING' : 'PRE_ENROLLED')
        summary.retaking++
      }
    }
  }
  console.log(
    `Sample cohorts: ${summary.students} students, ${summary.grades} grades, ${summary.current} enrolled in ${CURRENT_TERM}, ` +
      `${summary.retaking} retaking in ${OPEN_TERM}, ${summary.graduated} with the whole flowchart`,
  )
}

async function main() {
  await reset()
  await seedAcademicStructure()
  const career = await seedSystemsCurriculum()
  const { professorIds, studentId } = await seedUsers(career.id)
  await seedDepartmentHead()
  await seedStudentHistory(career.id, studentId, professorIds)
  await seedOpenTermOffer(career.id, professorIds)
  await seedAdminConfig()
  await seedProfessorSections()
  await seedPublishedGrades()
  await seedSampleCohorts(career.id, professorIds)
  console.log('Seed completed')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
