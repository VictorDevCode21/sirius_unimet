// Prerequisite rules: the requirements of a subject must exist, come from earlier terms, never close a cycle and ask
// for a reachable number of credits.
import { createsCycle } from '@/domain/prerequisites/prerequisite-engine'

export const ALTERNATIVE_BLOCK_PATTERN = /^[A-Z]{1,6}$/

export interface PrerequisiteNode {
  id: string
  code: string
  term: number
  credits: number
  prerequisiteIds: string[]
}

export interface RequirementsDraft {
  requirementIds: string[]
  minCredits: number | null
  alternativeCredits: number | null
  alternativeCreditBlock: string | null
}

// Every problem of the requirements proposed for a subject, given the other subjects of its curriculum.
export function validateRequirements(subjects: PrerequisiteNode[], subjectId: string, draft: RequirementsDraft) {
  const byId = new Map(subjects.map((subject) => [subject.id, subject]))
  const subject = byId.get(subjectId)
  if (!subject) return ['La materia no pertenece a este pensum.']

  const errors: string[] = []
  const graph = new Map(subjects.map((other) => [other.id, other.id === subjectId ? [] : other.prerequisiteIds]))
  const accepted: string[] = []

  for (const requirementId of new Set(draft.requirementIds)) {
    const requirement = byId.get(requirementId)
    if (requirementId === subjectId) {
      errors.push(`${subject.code} no puede prelarse a sí misma.`)
    } else if (!requirement) {
      errors.push(`Una de las prelaciones de ${subject.code} no existe en esta carrera.`)
    } else if (requirement.term >= subject.term) {
      errors.push(`La prelación ${requirement.code} debe ser de un trimestre anterior al de ${subject.code}.`)
    } else if (createsCycle(graph, subjectId, requirementId)) {
      errors.push(`La prelación ${requirement.code} crea un ciclo con ${subject.code}.`)
    } else {
      accepted.push(requirementId)
      graph.set(subjectId, accepted)
    }
  }

  const earlierCredits = subjects.filter((other) => other.term < subject.term).reduce((sum, other) => sum + other.credits, 0)
  if (draft.minCredits !== null) {
    if (!Number.isInteger(draft.minCredits) || draft.minCredits < 0) errors.push('Las UC mínimas deben ser un número entero positivo.')
    else if (draft.minCredits > earlierCredits) {
      errors.push(`Las UC mínimas (${draft.minCredits}) superan las ${earlierCredits} UC de los trimestres anteriores a ${subject.code}.`)
    }
  }

  const { alternativeCredits: credits, alternativeCreditBlock: block } = draft
  if ((credits === null) !== (block === null)) {
    errors.push('La alternativa necesita las UC y el bloque, o ninguno de los dos.')
  } else if (credits !== null && block !== null) {
    const blockCredits = subjects
      .filter((other) => other.term < subject.term && other.code.startsWith(block))
      .reduce((sum, other) => sum + other.credits, 0)
    if (!ALTERNATIVE_BLOCK_PATTERN.test(block)) errors.push('El bloque de la alternativa debe tener solo letras, por ejemplo BP.')
    if (!Number.isInteger(credits) || credits <= 0) errors.push('Las UC de la alternativa deben ser mayores que cero.')
    else if (credits > blockCredits) {
      errors.push(`La alternativa pide ${credits} UC del bloque ${block}, pero antes de ${subject.code} solo hay ${blockCredits}.`)
    }
    if (!draft.requirementIds.length && draft.minCredits === null) {
      errors.push('La alternativa necesita una prelación o UC mínimas a las que reemplazar.')
    }
  }

  return errors
}
