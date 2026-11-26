// Test data for the end-to-end suite. Run with `npx tsx tests/e2e/support/e2e-student.ts <command>`.
// setup: creates the E2E student with the academic history of the seeded sample student and no pre-enrollment.
// teardown: deletes the E2E student and everything it owns.
// reset-selection: empties the E2E student's pre-enrollment of the open term.
// close-term / open-term: closes or reopens the seeded open term.
// fill-section / restore-section <code> <number>: sets a section of the open term to 0 seats or back to 30.
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { prisma } from '@/data-access/prisma'
import { E2E_STUDENT } from './constants'

const SOURCE_EMAIL = 'r.victor@correo.unimet.edu.ve'
const OPEN_TERM = '2627-2'

async function teardown() {
  const student = await prisma.user.findUnique({ where: { email: E2E_STUDENT.email } })
  if (!student) return
  await prisma.grade.deleteMany({ where: { studentId: student.id } })
  await prisma.enrollment.deleteMany({ where: { studentId: student.id } })
  await prisma.user.delete({ where: { id: student.id } })
}

async function setup() {
  await teardown()
  const source = await prisma.user.findUniqueOrThrow({
    where: { email: SOURCE_EMAIL },
    include: {
      grades: true,
      enrollments: { where: { status: 'CONFIRMED' }, include: { details: true } },
    },
  })
  const student = await prisma.user.create({
    data: {
      email: E2E_STUDENT.email,
      name: E2E_STUDENT.name,
      passwordHash: await bcrypt.hash(E2E_STUDENT.password, 10),
      role: 'STUDENT',
      careerId: source.careerId,
    },
  })
  await prisma.grade.createMany({
    data: source.grades.map(({ sectionId, value, status, published }) => ({ sectionId, value, status, published, studentId: student.id })),
  })
  for (const enrollment of source.enrollments) {
    await prisma.enrollment.create({
      data: {
        studentId: student.id,
        termId: enrollment.termId,
        status: 'CONFIRMED',
        amount: enrollment.amount,
        details: { create: enrollment.details.map(({ sectionId }) => ({ sectionId })) },
      },
    })
  }
}

async function resetSelection() {
  const student = await prisma.user.findUniqueOrThrow({ where: { email: E2E_STUDENT.email } })
  await prisma.enrollment.deleteMany({ where: { studentId: student.id, term: { name: OPEN_TERM } } })
}

async function setTermOpen(open: boolean) {
  await prisma.term.update({ where: { name: OPEN_TERM }, data: { open } })
}

async function setSectionCapacity(capacity: number) {
  const [code, number] = process.argv.slice(3)
  await prisma.section.updateMany({
    where: { number: Number(number), subject: { code }, term: { name: OPEN_TERM } },
    data: { capacity },
  })
}

const commands: Record<string, () => Promise<void>> = {
  setup,
  teardown,
  'reset-selection': resetSelection,
  'close-term': () => setTermOpen(false),
  'open-term': () => setTermOpen(true),
  'fill-section': () => setSectionCapacity(0),
  'restore-section': () => setSectionCapacity(30),
}

const command = commands[process.argv[2] ?? '']
if (!command) {
  console.error(`Unknown command. Use one of: ${Object.keys(commands).join(', ')}`)
  process.exit(1)
}

command()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
