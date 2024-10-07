// src/utils/checkDependencies.ts

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFilePromise = promisify(execFile)

/**
 * Check if required dependencies are installed.
 * @param dependencies - List of command-line tools to check.
 * @returns A promise that resolves when all dependencies are checked.
 */
export async function checkDependencies(dependencies: string[]): Promise<void> {
  for (const command of dependencies) {
    try {
      await execFilePromise(command, ['--version'])
    } catch (error) {
      throw new Error(
        `Dependency '${command}' is not installed or not found in PATH. Please install it to proceed.`
      )
    }
  }
}