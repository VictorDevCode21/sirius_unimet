import type { PrismaClient } from '@/data-access/generated/prisma/client'
import { prisma as defaultClient } from '@/data-access/prisma'
import type { CurriculumRow, CurriculumWriter } from '@/domain/curriculum/csv-importer'

// Replaces every subject and prerequisite of a career inside one transaction. Subjects kept by the file keep their id
// and move to their new cells; they first go to temporary cells so swapping two cells never hits the unique cell rule.
export function createCurriculumRepository(client: PrismaClient = defaultClient): CurriculumWriter {
  return {
    async replaceCareerCurriculum(careerId: string, rows: CurriculumRow[], assertRemovable) {
      await client.$transaction(async (tx) => {
        // Imports of the same career run one after the other.
        await tx.$queryRaw`SELECT "id" FROM "Career" WHERE "id" = ${careerId}::uuid FOR UPDATE`
        const current = await tx.subject.findMany({ where: { careerId }, select: { code: true, _count: { select: { sections: true } } } })
        assertRemovable(current.map((subject) => ({ code: subject.code, sections: subject._count.sections })))

        const fileCodes = rows.map((row) => row.code)
        await tx.prerequisite.deleteMany({ where: { subject: { careerId } } })
        await tx.subject.deleteMany({ where: { careerId, code: { notIn: fileCodes } } })
        // Temporary cells: negative, distinct for every (term, branch) and outside the grid.
        await tx.$executeRaw`
          UPDATE "Subject" SET "term" = -("term" * 10 + "branch"), "branch" = 0
          WHERE "careerId" = ${careerId}::uuid AND "code" = ANY(${fileCodes}::text[])`

        const idByCode = new Map<string, string>()
        for (const row of rows) {
          const data = {
            name: row.name,
            credits: row.credits,
            term: row.term,
            branch: row.branch,
            minCredits: row.minCredits,
            alternativeCredits: row.alternative?.credits ?? null,
            alternativeCreditBlock: row.alternative?.block ?? null,
          }
          const subject = await tx.subject.upsert({
            where: { careerId_code: { careerId, code: row.code } },
            update: data,
            create: { careerId, code: row.code, ...data },
          })
          idByCode.set(row.code, subject.id)
        }

        await tx.prerequisite.createMany({
          data: rows.flatMap((row) =>
            row.prerequisiteCodes.map((code) => ({ subjectId: idByCode.get(row.code)!, requirementId: idByCode.get(code)! })),
          ),
        })
      })
    },
  }
}
