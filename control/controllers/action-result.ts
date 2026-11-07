import 'server-only'
import { revalidatePath } from 'next/cache'
import { DomainError } from '@/domain/shared/domain-error'

export interface ActionResult {
  ok: boolean
  message: string
}

// Runs a use case, refreshes the given route trees and turns business rule violations into a message for the UI.
export async function runAction(useCase: () => Promise<string>, paths: string[]): Promise<ActionResult> {
  try {
    const message = await useCase()
    for (const path of paths) revalidatePath(path, 'layout')
    return { ok: true, message }
  } catch (error) {
    if (error instanceof DomainError) return { ok: false, message: error.message }
    throw error
  }
}
