// src/types/logging.ts

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