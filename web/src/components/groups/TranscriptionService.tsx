// web/src/components/groups/TranscriptionService.tsx

import React from 'react'
import { T_CONFIG } from '../../../../shared/constants.ts'

export const TranscriptionService: React.FC<{
 transcriptionService: string
 setTranscriptionService: React.Dispatch<React.SetStateAction<string>>
 transcriptionApiKey: string
 setTranscriptionApiKey: React.Dispatch<React.SetStateAction<string>>
 selectedTranscriptionApiKeyService: string
 setSelectedTranscriptionApiKeyService: React.Dispatch<React.SetStateAction<string>>
}> = ({
 transcriptionService,
 setTranscriptionService,
 transcriptionApiKey,
 setTranscriptionApiKey,
 selectedTranscriptionApiKeyService,
 setSelectedTranscriptionApiKeyService
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
         {Object.values(T_CONFIG).map((service) => (
           <option key={service.value} value={service.value}>
             {service.label}
           </option>
         ))}
       </select>
     </div>

    <div className="form-group">
      <label htmlFor="transcriptionApiKeyService">Transcription API Key Service</label>
      <select
        id="transcriptionApiKeyService"
        value={selectedTranscriptionApiKeyService}
        onChange={(e) => setSelectedTranscriptionApiKeyService(e.target.value)}
      >
        <option value="assembly">Assembly</option>
        <option value="deepgram">Deepgram</option>
      </select>
    </div>

    <div className="form-group">
      <label htmlFor="transcriptionApiKey">Transcription API Key</label>
      <input
        type="text"
        id="transcriptionApiKey"
        value={transcriptionApiKey}
        onChange={(e) => setTranscriptionApiKey(e.target.value)}
      />
    </div>
   </>
 )
}