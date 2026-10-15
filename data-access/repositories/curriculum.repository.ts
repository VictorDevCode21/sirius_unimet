import type { PrismaClient } from '@/data-access/generated/prisma/client'
import { prisma as defaultClient } from '@/data-access/prisma'
import type { CurriculumRow, CurriculumWriter } from '@/domain/curriculum/csv-importer'

// Replaces every subject and prerequisite of a career inside one transaction.
export function createCurriculumRepository(client: PrismaClient = defaultClient): CurriculumWriter {
  return {
    async replaceCareerCurriculum(careerId: string, rows: CurriculumRow[]) {
      await client.$transaction(async (tx) => {
        await tx.prerequisite.deleteMany({ where: { subject: { careerId } } })
        await tx.subject.deleteMany({ where: { careerId, sections: { none: {} } } })

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
