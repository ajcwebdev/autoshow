// src/types/logging.ts

export interface TokenUsage {
  input: number | undefined
  output: number | undefined
  total: number | undefined
}

export interface CostCalculation {
  inputCost: number | undefined
  outputCost: number | undefined
  totalCost: number | undefined
}

export interface APILogInfo {
  modelName: string
  stopReason: string
  tokenUsage: TokenUsage
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