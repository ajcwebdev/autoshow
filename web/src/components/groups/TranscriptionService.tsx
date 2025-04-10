// web/src/components/groups/TranscriptionService.tsx

import React from 'react'

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
  transcriptionCosts: any
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
      const rtBody: any = {
        finalPath,
        transcriptServices: transcriptionService,
        options: {}
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
      const rtData = await rtRes.json()
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
      <h3>Select a Transcription Service</h3>
      {!Object.keys(transcriptionCosts).length && <p>No cost data available</p>}
      {Object.entries(transcriptionCosts).map(([svc, models]) => (
        <div key={svc}>
          <h4>{svc}</h4>
          {(models as any[]).map(m => (
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
              <label>{m.modelId} - Cost: {m.cost} cents ({Math.round(m.cost * 50000000)} credits)</label>
            </div>
          ))}
        </div>
      ))}
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
