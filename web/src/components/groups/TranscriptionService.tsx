// web/src/components/groups/TranscriptionService.tsx

import React from 'react'
import type { TranscriptionCosts } from '../../../../shared/types.ts'

export const TranscriptionStep: React.FC<{
  isLoading: boolean
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
  setError: React.Dispatch<React.SetStateAction<string | null>>
  transcriptionService: string
  setTranscriptionService: React.Dispatch<React.SetStateAction<string>>
  transcriptionModel: string
  setTranscriptionModel: React.Dispatch<React.SetStateAction<string>>
  transcriptionApiKey: string
  setTranscriptionApiKey: React.Dispatch<React.SetStateAction<string>>
  finalPath: string
  setTranscriptContent: React.Dispatch<React.SetStateAction<string>>
  setTranscriptionModelUsed: React.Dispatch<React.SetStateAction<string>>
  setTranscriptionCostUsed: React.Dispatch<React.SetStateAction<number | null>>
  transcriptionCosts: TranscriptionCosts
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>
}> = ({
  isLoading,
  setIsLoading,
  setError,
  transcriptionService,
  setTranscriptionService,
  transcriptionModel,
  setTranscriptionModel,
  transcriptionApiKey,
  setTranscriptionApiKey,
  finalPath,
  setTranscriptContent,
  setTranscriptionModelUsed,
  setTranscriptionCostUsed,
  transcriptionCosts,
  setCurrentStep
}) => {
  const handleStepTwo = async () => {
    setIsLoading(true)
    setError(null)
    setTranscriptContent('')
    try {
      const rtBody = {
        finalPath,
        transcriptServices: transcriptionService,
        options: {}
      } as {
        finalPath: string
        transcriptServices: string
        options: Record<string, unknown>
      }
      rtBody.options[transcriptionService] = transcriptionModel
      if (transcriptionService === 'assembly') rtBody.options.assemblyApiKey = transcriptionApiKey
      if (transcriptionService === 'deepgram') rtBody.options.deepgramApiKey = transcriptionApiKey
      const rtRes = await fetch('http://localhost:3000/run-transcription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rtBody)
      })
      if (!rtRes.ok) throw new Error('Error running transcription')
      const rtData = await rtRes.json() as {
        transcript?: string
        modelId?: string
        transcriptionCost?: number
      }
      setTranscriptContent(rtData.transcript || '')
      if (rtData.modelId) setTranscriptionModelUsed(rtData.modelId)
      if (rtData.transcriptionCost != null) setTranscriptionCostUsed(rtData.transcriptionCost)
      setCurrentStep(3)
    } catch (err) {
      if (err instanceof Error) setError(err.message)
      else setError('An unknown error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <h2>Select a Transcription Service</h2>
      {!Object.keys(transcriptionCosts).length && <p>No cost data available</p>}
      {Object.entries(transcriptionCosts).map(([svc, models]) => (
        <div key={svc}>
          <h3>{svc}</h3>
          {models.map(m => (
            <div key={m.modelId}>
              <input
                type="radio"
                name="transcriptionChoice"
                value={`${svc}:${m.modelId}`}
                checked={transcriptionService === svc && transcriptionModel === m.modelId}
                onChange={() => {
                  setTranscriptionService(svc)
                  setTranscriptionModel(m.modelId)
                }}
              />
              <label>{m.modelId}</label>
              <div>{(m.cost * 500).toFixed(1)} credits ({m.cost}¢)</div>
            </div>
          ))}
        </div>
      ))}
      <br /><br />
      <div className="form-group">
        <label htmlFor="transcriptionApiKey">Transcription API Key</label>
        <input
          type="text"
          id="transcriptionApiKey"
          value={transcriptionApiKey}
          onChange={e => setTranscriptionApiKey(e.target.value)}
        />
      </div>
      <button disabled={isLoading} onClick={handleStepTwo}>
        {isLoading ? 'Transcribing...' : 'Generate Transcription'}
      </button>
    </>
  )
}