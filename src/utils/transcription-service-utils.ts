// src/utils/transcription-service-utils.ts

import { env } from '../utils/node-utils.ts'
import { TRANSCRIPTION_SERVICES_CONFIG } from '../../shared/constants.ts'

/**
 * Ensures the correct environment variable for the given transcription service is set.
 * For example, if serviceName = 'deepgram', we look up 'deepgramApiKey' from the config,
 * then confirm env['DEEPGRAM_API_KEY'] is defined.
 */
export function checkTranscriptionApiKey(serviceName: string) {
  const serviceConfig = TRANSCRIPTION_SERVICES_CONFIG[serviceName as keyof typeof TRANSCRIPTION_SERVICES_CONFIG]
  if (!serviceConfig) {
    // e.g., if we somehow got an unknown service, do nothing or throw an error
    return
  }
  // Some services might not have an API key property (Whisper is local).
  // If it exists, confirm that env is set
  const keyProp = (serviceConfig as { apiKeyPropName?: string }).apiKeyPropName
  if (keyProp) {
    // e.g., 'deepgramApiKey', 'assemblyApiKey'
    if (!env[keyProp.toUpperCase()]) {
      throw new Error(`Missing environment variable for ${serviceConfig.label}: ${keyProp.toUpperCase()}`)
    }
  }
}
