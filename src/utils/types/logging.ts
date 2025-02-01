// src/types/logging.ts

/**
 * A union type representing the various logging contexts for which a separator can be logged.
 */
export type SeparatorParams =
  | {
      /**
       * The context type: channel, playlist, or urls
       */
      type: 'channel' | 'playlist' | 'urls'
      /**
       * The zero-based index of the current item being processed
       */
      index: number
      /**
       * The total number of items to be processed
       */
      total: number
      /**
       * The URL string to be displayed
       */
      descriptor: string
    }
  | {
      /**
       * The context type: rss
       */
      type: 'rss'
      /**
       * The zero-based index of the current item being processed
       */
      index: number
      /**
       * The total number of items to be processed
       */
      total: number
      /**
       * The title string to be displayed
       */
      descriptor: string
    }
  | {
      /**
       * The context type: completion
       */
      type: 'completion'
      /**
       * The action string that was completed successfully
       */
      descriptor: string
    }

/**
 * Represents the complete LLM cost and usage details for logging
 */
export type LogLLMCost = {
  /**
   * The name of the model used
   */
  modelName: string
  /**
   * The reason why the model request stopped
   */
  stopReason: string
  /**
   * Contains token usage details
   */
  tokenUsage: {
    /**
     * Number of input tokens used
     */
    input: number | undefined
    /**
     * Number of output tokens generated
     */
    output: number | undefined
    /**
     * Total number of tokens involved in the request
     */
    total: number | undefined
  }
}

/**
 * Interface for chainable logger with style methods.
 */
export interface ChainableLogger {
    (...args: any[]): void
    step: (...args: any[]) => void
    dim: (...args: any[]) => void
    success: (...args: any[]) => void
    warn: (...args: any[]) => void
    opts: (...args: any[]) => void
    info: (...args: any[]) => void
    wait: (...args: any[]) => void
    final: (...args: any[]) => void
  }