// web/src/components/app/groups/TranscriptionService.tsx

import React from 'react'
import { TRANSCRIPTION_SERVICES_CONFIG } from '../../../../../shared/constants'

/**
 * The TranscriptionService component provides a dropdown for selecting
 * the transcription service, and conditionally displays a second dropdown
 * when a Whisper service is chosen.
 *
 * @param {{
 *   transcriptionService: string,
 *   setTranscriptionService: React.Dispatch<React.SetStateAction<string>>,
 *   whisperModel: string,
 *   setWhisperModel: React.Dispatch<React.SetStateAction<string>>
 * }} props
 * @returns {JSX.Element}
 */
export const TranscriptionService: React.FC<{
  transcriptionService: string
  setTranscriptionService: React.Dispatch<React.SetStateAction<string>>
  whisperModel: string
  setWhisperModel: React.Dispatch<React.SetStateAction<string>>
}> = ({
  transcriptionService,
  setTranscriptionService,
  whisperModel,
  setWhisperModel
}) => {
  return (
    <>
      <div className="form-group">
        <label htmlFor="transcriptionService">Transcription Service</label>
        <select
          id="transcriptionService"
          value={transcriptionService}
          onChange={(e) => setTranscriptionService(e.target.value)}
        >
          {Object.values(TRANSCRIPTION_SERVICES_CONFIG).map((service) => (
            <option key={service.value} value={service.value}>
              {service.label}
            </option>
          ))}
        </select>
      </div>

      {transcriptionService.startsWith('whisper') && (
        <div className="form-group">
          <label htmlFor="whisperModel">Whisper Model</label>
          <select
            id="whisperModel"
            value={whisperModel}
            onChange={(e) => setWhisperModel(e.target.value)}
          >
            {TRANSCRIPTION_SERVICES_CONFIG.whisper.models.map((model) => (
              <option key={model.label} value={model.label}>
                {model.value}
              </option>
            ))}
          </select>
        </div>
      )}
    </>
  )
}