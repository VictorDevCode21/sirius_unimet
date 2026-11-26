import { execFileSync } from 'node:child_process'

// Runs a command of the E2E data script against the local database.
export function e2eData(
  command: 'setup' | 'teardown' | 'reset-selection' | 'close-term' | 'open-term' | 'fill-section' | 'restore-section',
  ...args: string[]
) {
  execFileSync('npx', ['tsx', 'tests/e2e/support/e2e-student.ts', command, ...args], { stdio: 'inherit' })
}
