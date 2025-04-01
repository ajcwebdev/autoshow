// src/utils/cost-calculator.ts

import { execPromise } from './node-utils.ts'
import { TRANSCRIPTION_SERVICES_CONFIG, LLM_SERVICES_CONFIG } from '../../shared/constants.ts'

export async function getAudioDurationInMinutes(filePath: string): Promise<number> {
  const cmd = `ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`
  const { stdout } = await execPromise(cmd)
  const seconds = parseFloat(stdout.trim())
  if (isNaN(seconds)) {
    throw new Error(`Could not parse audio duration for file: ${filePath}`)
  }
  return seconds / 60
}

/**
 * Compute transcription cost
 */
export function computeTranscriptionCost(
  serviceKey: keyof typeof TRANSCRIPTION_SERVICES_CONFIG,
  modelId: string,
  minutes: number
): number {
  const config = TRANSCRIPTION_SERVICES_CONFIG[serviceKey]
  const modelInfo = config.models.find(m => m.modelId.toLowerCase() === modelId.toLowerCase())
  if (!modelInfo) {
    return 0
  }
  return modelInfo.costPerMinuteCents * minutes
}

/**
 * Some numeric fields in LLM_SERVICES_CONFIG are typed as “3 | 0.2 | …”.
 * TS sees “no overlap with 0.” We fix by converting them to number before comparing.
 */
export function computeLLMCost(
  serviceKey: keyof typeof LLM_SERVICES_CONFIG,
  modelId: string,
  tokenUsage: { input?: number; output?: number; total?: number }
): number {
  const serviceCfg = LLM_SERVICES_CONFIG[serviceKey]
  if (!serviceCfg) return 0

  const modelCfg = serviceCfg.models.find(m => m.modelId.toLowerCase() === modelId.toLowerCase())
  if (!modelCfg) return 0

  // Convert possible union values to plain numbers
  const inputCostM = Number(modelCfg.inputCostPer1M || 0)
  const inputCostC = Number(modelCfg.inputCostPer1MCents || 0)
  const outputCostM = Number(modelCfg.outputCostPer1M || 0)
  const outputCostC = Number(modelCfg.outputCostPer1MCents || 0)

  // If cost is effectively 0 for input+output, return 0
  const noCostInput = (inputCostM === 0 && inputCostC === 0)
  const noCostOutput = (outputCostM === 0 && outputCostC === 0)
  if (noCostInput && noCostOutput) {
    return 0
  }

  const inputTokens = tokenUsage.input || 0
  const outputTokens = tokenUsage.output || 0

  // Convert cost from e.g. inputCostPer1MCents => actual dollars, or from inputCostPer1M => dollars
  const inCost = inputCostC > 0
    ? (inputCostC / 100)
    : inputCostM

  const outCost = outputCostC > 0
    ? (outputCostC / 100)
    : outputCostM

  const costForInput = (inputTokens / 1_000_000) * inCost
  const costForOutput = (outputTokens / 1_000_000) * outCost
  return costForInput + costForOutput
}
