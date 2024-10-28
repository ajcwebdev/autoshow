// src/utils/checkDependencies.ts

/**
 * @file Utility for verifying required command-line dependencies.
 * Checks if necessary external tools are installed and accessible in the system PATH.
 * @packageDocumentation
 */

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

// Promisify execFile for async/await usage
const execFilePromise = promisify(execFile)

/**
 * Verifies that required command-line dependencies are installed and accessible.
 * Attempts to execute each dependency with --version flag to confirm availability.
 * 
 * Common dependencies checked include:
 * - yt-dlp: For downloading online content
 * - ffmpeg: For audio processing
 * 
 * @param {string[]} dependencies - Array of command names to verify.
 *                                 Each command should support the --version flag.
 * 
 * @returns {Promise<void>} Resolves when all dependencies are verified.
 * 
 * @throws {Error} If any dependency is:
 *   - Not installed
 *   - Not found in system PATH
 *   - Not executable
 *   - Returns non-zero exit code
 * 
 * @example
 * try {
 *   await checkDependencies(['yt-dlp', 'ffmpeg'])
 *   console.log('All dependencies are available')
 * } catch (error) {
 *   console.error('Missing dependency:', error.message)
 * }
 */
export async function checkDependencies(dependencies: string[]): Promise<void> {
  for (const command of dependencies) {
    try {
      // Attempt to execute command with --version flag
      await execFilePromise(command, ['--version'])
    } catch (error) {
      // Throw descriptive error if command check fails
      throw new Error(
        `Dependency '${command}' is not installed or not found in PATH. Please install it to proceed.`
      )
    }
  }
}