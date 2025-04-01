// src/utils/service-config.ts

import { LLM_SERVICES_CONFIG, TRANSCRIPTION_SERVICES_CONFIG, ENV_VARS_MAP } from '../../shared/constants.ts'
import { err } from './logging.ts'
import { env } from './node-utils.ts'
import type { ProcessingOptions, LlmServiceKey } from '../../shared/types.ts'

// Type for transcription services
export type TranscriptionServiceKey = 'whisper' | 'deepgram' | 'assembly'

// Helper function to validate LLM service and model
export function validateLLMService(
  options: ProcessingOptions,
  providedService?: string
): {
  service: LlmServiceKey | null
  modelId: string | null
  isValid: boolean
} {
  // Return null values if no LLM service should be used
  if (providedService === 'skip' || !providedService) {
    return { service: null, modelId: null, isValid: true }
  }

  // Check if the provided service is valid
  if (!Object.keys(LLM_SERVICES_CONFIG).includes(providedService)) {
    err(`Invalid LLM service: ${providedService}`)
    return { service: null, modelId: null, isValid: false }
  }

  const service = providedService as LlmServiceKey
  const serviceConfig = LLM_SERVICES_CONFIG[service]
  
  // Check for API key except for 'skip' service
  if (service !== 'skip' && 'apiKeyPropName' in serviceConfig) {
    const apiKeyPropName = serviceConfig.apiKeyPropName as keyof typeof ENV_VARS_MAP
    const envVarName = ENV_VARS_MAP[apiKeyPropName]
    if (!env[envVarName]) {
      err(`Missing ${envVarName} environment variable for ${serviceConfig.serviceName}`)
      return { service, modelId: null, isValid: false }
    }
  }

  // Get the user-provided model or use default
  const optionValue = options[service]
  const defaultModelId = serviceConfig.models[0]?.modelId ?? ''
  
  const modelId = (
    typeof optionValue === 'string' && 
    optionValue !== 'true' && 
    optionValue.trim() !== ''
  ) ? optionValue : defaultModelId

  // Validate that the model exists for this service
  const modelExists = serviceConfig.models.some(model => model.modelId === modelId)
  if (!modelExists) {
    err(`Model ${modelId} not found for service ${serviceConfig.serviceName}`)
    return { service, modelId, isValid: false }
  }

  return { service, modelId, isValid: true }
}

// Helper function to validate transcription service and model
export function validateTranscriptionService(
  options: ProcessingOptions,
  providedService?: string
): {
  service: TranscriptionServiceKey | null
  modelId: string
  isValid: boolean
} {
  // Default to whisper if no service provided
  const serviceInput = providedService || 
    (options.deepgram ? 'deepgram' : 
     options.assembly ? 'assembly' : 'whisper')

  // Check if the provided service is valid
  if (!(['whisper', 'deepgram', 'assembly'] as const).includes(serviceInput as any)) {
    err(`Invalid transcription service: ${serviceInput}`)
    return { service: null, modelId: '', isValid: false }
  }
  
  const service = serviceInput as TranscriptionServiceKey
  const serviceConfig = TRANSCRIPTION_SERVICES_CONFIG[service]
  
  // Check for API key if needed (not needed for Whisper)
  if (service !== 'whisper') {
    const apiKeyName = `${service}ApiKey` as keyof typeof ENV_VARS_MAP
    const envVarName = ENV_VARS_MAP[apiKeyName]
    if (!env[envVarName]) {
      err(`Missing ${envVarName} environment variable for ${serviceConfig.serviceName}`)
      return { service: null, modelId: '', isValid: false }
    }
  }

  // Find default model for the service
  const defaultModelId = service === 'whisper' 
    ? 'base' 
    : service === 'deepgram'
    ? 'nova-2'
    : 'best'

  // Get user-provided model or use default
  const optionValue = options[service]
  const modelId = typeof optionValue === 'string' ? optionValue : defaultModelId

  // Validate that the model exists for this service
  const modelInfo = serviceConfig.models.find(
    (m: {modelId: string}) => m.modelId.toLowerCase() === modelId.toLowerCase()
  )
  
  if (!modelInfo) {
    err(`Model ${modelId} not found for service ${serviceConfig.serviceName}`)
    return { service: null, modelId, isValid: false }
  }

  return { service, modelId: modelInfo.modelId, isValid: true }
}

// Helper to get model configuration for a given service and model ID
export function getLLMModelConfig(service: LlmServiceKey, modelId: string) {
  const serviceConfig = LLM_SERVICES_CONFIG[service]
  return serviceConfig.models.find(model => model.modelId === modelId) || null
}

// Helper to get model configuration for a given transcription service and model ID
export function getTranscriptionModelConfig(service: TranscriptionServiceKey, modelId: string) {
  const serviceConfig = TRANSCRIPTION_SERVICES_CONFIG[service]
  return serviceConfig.models.find(
    (model: {modelId: string}) => model.modelId.toLowerCase() === modelId.toLowerCase()
  ) || null
}

// Helper to check if LLM service is requested in options
export function getLLMServiceFromOptions(options: ProcessingOptions): LlmServiceKey | null {
  const llmServices = Object.keys(LLM_SERVICES_CONFIG)
    .filter(key => key !== 'skip')
    .filter(key => {
      const value = options[key as keyof ProcessingOptions]
      return value !== undefined && value !== null && value !== false
    })

  if (llmServices.length > 1) {
    err(`Multiple LLM services specified (${llmServices.join(', ')}). Please specify only one.`)
    return null
  }

  return (llmServices[0] as LlmServiceKey) || null
}

// Helper to check if transcription service is requested in options
export function getTranscriptionServiceFromOptions(options: ProcessingOptions): TranscriptionServiceKey {
  if (options.deepgram) {
    return 'deepgram'
  } else if (options.assembly) {
    return 'assembly'
  } else {
    // Default to whisper
    return 'whisper'
  }
}