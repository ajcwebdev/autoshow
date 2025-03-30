// web/src/components/groups/TranscriptionService.tsx

import React from 'react'
import { TRANSCRIPTION_SERVICES_CONFIG } from '../../../../shared/constants.ts'

/**
 * The TranscriptionService component provides a dropdown for selecting
 * the transcription service, and conditionally displays a second dropdown
 * when a Whisper service is chosen. It also displays fields for specifying
 * an external transcription API key and service if the chosen service
 * is not Whisper-based.
 *
 * @param {{
*   transcriptionService: string,
*   setTranscriptionService: React.Dispatch<React.SetStateAction<string>>,
*   whisperModel: string,
*   setWhisperModel: React.Dispatch<React.SetStateAction<string>>,
*   transcriptionApiKey: string,
*   setTranscriptionApiKey: React.Dispatch<React.SetStateAction<string>>,
*   selectedTranscriptionApiKeyService: string,
*   setSelectedTranscriptionApiKeyService: React.Dispatch<React.SetStateAction<string>>
* }} props
* @returns {JSX.Element}
*/
export const TranscriptionService: React.FC<{
 transcriptionService: string
 setTranscriptionService: React.Dispatch<React.SetStateAction<string>>
 whisperModel: string
 setWhisperModel: React.Dispatch<React.SetStateAction<string>>
 transcriptionApiKey: string
 setTranscriptionApiKey: React.Dispatch<React.SetStateAction<string>>
 selectedTranscriptionApiKeyService: string
 setSelectedTranscriptionApiKeyService: React.Dispatch<React.SetStateAction<string>>
}> = ({
 transcriptionService,
 setTranscriptionService,
 whisperModel,
 setWhisperModel,
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
             <option key={model.modelId} value={model.modelId}>
               {model.modelId}
             </option>
           ))}
         </select>
       </div>
     )}

     {!transcriptionService.startsWith('whisper') && (
       <>
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
     )}
   </>
 )
}