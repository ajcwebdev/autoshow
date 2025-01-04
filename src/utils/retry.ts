// src/utils/retry.ts

import { l, err } from './logging'

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