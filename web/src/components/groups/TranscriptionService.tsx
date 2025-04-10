// web/src/components/groups/TranscriptionService.tsx

import React from 'react'

export const TranscriptionService: React.FC<{
  transcriptionApiKey: string
  setTranscriptionApiKey: React.Dispatch<React.SetStateAction<string>>
}> = ({
  transcriptionApiKey,
  setTranscriptionApiKey
}) => {
  return (
    <div className="form-group">
      <label htmlFor="transcriptionApiKey">Transcription API Key</label>
      <input
        type="text"
        id="transcriptionApiKey"
        value={transcriptionApiKey}
        onChange={e => setTranscriptionApiKey(e.target.value)}
      />
    </div>
  )
}