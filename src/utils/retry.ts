// src/utils/retry.ts

import { l, err } from './logging'
import { execFilePromise } from './globals/process'

/**
 * Executes a command with retry logic to recover from transient failures.
 * 
 * @param {string} command - The command to execute.
 * @param {string[]} args - Arguments for the command.
 * @param {number} retries - Number of retry attempts.
 * @returns {Promise<void>} Resolves if the command succeeds.
 * @throws {Error} If the command fails after all retry attempts.
 */
export async function executeWithRetry(
  command: string,
  args: string[],
  retries: number
): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Attempt to execute the command
      const { stderr } = await execFilePromise(command, args)
      // Log any warnings from yt-dlp
      if (stderr) {
        err(`yt-dlp warnings: ${stderr}`)
      }
      return
    } catch (error) {
      // If the last attempt fails, throw the error
      if (attempt === retries) {
        err(`Failed after ${retries} attempts`)
        throw error
      }

      // Exponential backoff: Wait before trying again
      const delayMs = 1000 * 2 ** (attempt - 1) // 1s, 2s, 4s, ...
      l.wait(
        `Retry ${attempt} of ${retries} failed. Waiting ${delayMs} ms before next attempt...`
      )
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
}

/**
 * Retries a given LLM call with the specified maximum attempts and delay between retries.
 * 
 * @param {() => Promise<void>} fn - The function to execute for the LLM call
 * @param {number} maxRetries - The maximum number of retry attempts
 * @param {number} delayBetweenRetries - Delay in milliseconds between retry attempts
 * @returns {Promise<void>} Resolves when the function succeeds or rejects after max attempts
 */
export async function retryLLMCall(
  fn: () => Promise<void>,
  maxRetries: number,
  delayBetweenRetries: number
): Promise<void> {
  let attempt = 0

  while (attempt < maxRetries) {
    try {
      attempt++
      l.wait(`  Attempt ${attempt} - Processing LLM call...\n`)
      await fn()
      l.wait(`\n  LLM call completed successfully on attempt ${attempt}.`)
      return
    } catch (error) {
      err(`  Attempt ${attempt} failed: ${(error as Error).message}`)
      if (attempt >= maxRetries) {
        err(`  Max retries (${maxRetries}) reached. Aborting LLM processing.`)
        throw error
      }
      l.wait(`  Retrying in ${delayBetweenRetries / 1000} seconds...`)
      await new Promise((resolve) => setTimeout(resolve, delayBetweenRetries))
    }
  }
}

/**
 * Retries a given transcription call with the specified maximum attempts and delay between retries.
 * 
 * @param {() => Promise<string>} fn - The function to execute for the transcription call
 * @param {number} maxRetries - The maximum number of retry attempts
 * @param {number} delayBetweenRetries - Delay in milliseconds between retry attempts
 * @returns {Promise<string>} Resolves when the function succeeds or rejects after max attempts
 */
export async function retryTranscriptionCall(
  fn: () => Promise<string>,
  maxRetries: number,
  delayBetweenRetries: number
): Promise<string> {
  let attempt = 0

  while (attempt < maxRetries) {
    try {
      attempt++
      l.wait(`  Attempt ${attempt} - Processing Transcription call...\n`)
      const transcript = await fn()
      l.wait(`\n  Transcription call completed successfully on attempt ${attempt}.`)
      return transcript
    } catch (error) {
      err(`  Attempt ${attempt} failed: ${(error as Error).message}`)
      if (attempt >= maxRetries) {
        err(`  Max retries (${maxRetries}) reached. Aborting transcription.`)
        throw error
      }
      l.wait(`  Retrying in ${delayBetweenRetries / 1000} seconds...`)
      await new Promise((resolve) => setTimeout(resolve, delayBetweenRetries))
    }
  }

  throw new Error('Transcription call failed after maximum retries.')
}