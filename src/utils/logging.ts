// src/utils/logging.ts

import chalk from 'chalk'

/**
 * Logs the first step of a top-level function call with its relevant options or parameters.
 *
 * @param functionName - The name of the top-level function being invoked.
 * @param details - An object containing relevant parameters to log
 */
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
 *
 * - For `channel`, `playlist`, or `urls`, provide `index`, `total`, and `descriptor` representing the URL.
 * - For `rss`, provide `index`, `total`, and `descriptor` representing the RSS item title.
 * - For `completion`, provide only the `descriptor` representing the completed action.
 *
 * @param params - An object describing the context and values needed to log the separator.
 */
export function logSeparator(params:
  | { type: 'channel' | 'playlist' | 'urls', index: number, total: number, descriptor: string  }
  | { type: 'rss', index: number, total: number, descriptor: string  }
  | { type: 'completion', descriptor: string  }
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
 * Creates a chainable logger function that uses the provided base logging function
 * and attaches chalk-styled methods for consistent usage.
 *
 * @param baseLogger - The underlying logging function (e.g., `console.log` or `console.error`).
 * @returns A chainable logger instance with styled methods.
 */
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