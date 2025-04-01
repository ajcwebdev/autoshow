// src/utils/logging.ts

import chalk from 'chalk'

export function logInitialFunctionCall(functionName: string, details: Record<string, unknown>): void {
  l.opts(`${functionName} called with the following arguments:\n`)
  for (const [key, value] of Object.entries(details)) {
    if (typeof value === 'object' && value !== null) {
      l.opts(`${key}:\n`)
      l.opts(`${JSON.stringify(value, null, 2)}`)
    } else {
      l.opts(`${key}: ${value}`)
    }
  }
  l.opts('')
}

/**
 * Logs a visual separator for different processing contexts, including channels, playlists, RSS feeds, URLs,
 * and a final completion message.
 */
export function logSeparator(params:
  | { type: 'channel' | 'playlist' | 'urls', index: number, total: number, descriptor: string }
  | { type: 'rss', index: number, total: number, descriptor: string }
  | { type: 'completion', descriptor: string }
) {
  switch (params.type) {
    case 'channel':
    case 'playlist':
    case 'urls':
      l.final(`\n================================================================================================`)
      if (params.type === 'urls') {
        l.final(`  Processing URL ${params.index + 1}/${params.total}: ${params.descriptor}`)
      } else {
        l.final(`  Processing video ${params.index + 1}/${params.total}: ${params.descriptor}`)
      }
      l.final(`================================================================================================\n`)
      break
    case 'rss':
      l.final(`\n========================================================================================`)
      l.final(`  Item ${params.index + 1}/${params.total} processing: ${params.descriptor}`)
      l.final(`========================================================================================\n`)
      break
    case 'completion':
      l.final(`\n================================================================================================`)
      l.final(`  ${params.descriptor} Processing Completed Successfully.`)
      l.final(`================================================================================================\n`)
      break
  }
}

/**
 * A helper function that logs an error message and optionally calls process.exit(1).
 * This replaces repeated patterns of logging + exit in various places.
 *
 * @param message - The error message to log
 * @param error - The actual error object (optional)
 * @param shouldExit - Whether to exit after logging
 */
export function logErrorAndMaybeExit(message: string, error?: Error, shouldExit = true): never | void {
  if (error) {
    err(`${message} ${error.message}`)
  } else {
    err(message)
  }
  if (shouldExit) {
    process.exit(1)
  }
}

function createChainableLogger(baseLogger: (...args: any[]) => void) {
  const logger = (...args: any[]) => baseLogger(...args)
  const styledLogger = Object.assign(logger, {
    step: (...args: any[]) => baseLogger(chalk.bold.underline(...args)),
    dim: (...args: any[]) => baseLogger(chalk.dim(...args)),
    success: (...args: any[]) => baseLogger(chalk.bold.blue(...args)),
    warn: (...args: any[]) => baseLogger(chalk.bold.yellow(...args)),
    opts: (...args: any[]) => baseLogger(chalk.magentaBright.bold(...args)),
    info: (...args: any[]) => baseLogger(chalk.magentaBright.bold(...args)),
    wait: (...args: any[]) => baseLogger(chalk.bold.cyan(...args)),
    final: (...args: any[]) => baseLogger(chalk.bold.italic(...args)),
  })
  return styledLogger
}

export const l = createChainableLogger(console.log)
export const err = createChainableLogger(console.error)
