// src/utils/llm-service-utils.ts

import { env } from '../utils/node-utils.ts'
import { LLM_SERVICES_CONFIG } from '../../shared/constants.ts'

/**
 * Ensures the correct environment variable for the given LLM service is set.
 */
export function checkLLMApiKey(serviceName: string) {
  const serviceConfig = LLM_SERVICES_CONFIG[serviceName as keyof typeof LLM_SERVICES_CONFIG]
  // If user picked "skip" or we have no apiKeyPropName, do nothing
  if (!serviceConfig || !('apiKeyPropName' in serviceConfig) || !serviceConfig.apiKeyPropName) {
    return
  }
  const envVarName = serviceConfig.apiKeyPropName
  if (!env[envVarName.toUpperCase()]) {
    throw new Error(`Missing environment variable for ${serviceConfig.label}: ${envVarName.toUpperCase()}`)
  }
}

/**
 * Combine user prompt + transcript
 */
export function buildCombinedPrompt(prompt: string, transcript: string) {
  return `${prompt}\n${transcript}`
}
