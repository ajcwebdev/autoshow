// web/src/components/groups/TranscriptionService.tsx

import { For, Show } from 'solid-js'
import type { Setter } from 'solid-js'
import type { TranscriptionCosts } from '../../../../shared/types.ts'

export const TranscriptionStep = (props: {
  isLoading: boolean
  setIsLoading: Setter<boolean>
  setError: Setter<string | null>
  transcriptionService: string
  setTranscriptionService: Setter<string>
  transcriptionModel: string
  setTranscriptionModel: Setter<string>
  transcriptionApiKey: string
  setTranscriptionApiKey: Setter<string>
  finalPath: string
  setTranscriptContent: Setter<string>
  setTranscriptionModelUsed: Setter<string>
  setTranscriptionCostUsed: Setter<number | null>
  transcriptionCosts: TranscriptionCosts
  setCurrentStep: Setter<number>
}) => {
  const handleStepTwo = async () => {
    props.setIsLoading(true)
    props.setError(null)
    props.setTranscriptContent('')
    try {
      const rtBody = {
        finalPath: props.finalPath,
        transcriptServices: props.transcriptionService,
        options: {}
      } as {
        finalPath: string
        transcriptServices: string
        options: Record<string, unknown>
      }
      rtBody.options[props.transcriptionService] = props.transcriptionModel
      if (props.transcriptionService === 'assembly') rtBody.options.assemblyApiKey = props.transcriptionApiKey
      if (props.transcriptionService === 'deepgram') rtBody.options.deepgramApiKey = props.transcriptionApiKey
      const rtRes = await fetch('http://localhost:4321/api/run-transcription', {
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
      props.setTranscriptContent(rtData.transcript || '')
      if (rtData.modelId) props.setTranscriptionModelUsed(rtData.modelId)
      if (rtData.transcriptionCost != null) props.setTranscriptionCostUsed(rtData.transcriptionCost)
      props.setCurrentStep(3)
    } catch (err) {
      if (err instanceof Error) props.setError(err.message)
      else props.setError('An unknown error occurred.')
    } finally {
      props.setIsLoading(false)
    }
  }

  return (
    <>
      <h2>Select a Transcription Service</h2>
      <Show when={!Object.keys(props.transcriptionCosts).length}>
        <p>No cost data available</p>
      </Show>
      <For each={Object.entries(props.transcriptionCosts)}>
        {([svc, models]) => (
          <div>
            <h3>{svc}</h3>
            <For each={models}>
              {m => (
                <div>
                  <input
                    type="radio"
                    name="transcriptionChoice"
                    value={`${svc}:${m.modelId}`}
                    checked={props.transcriptionService === svc && props.transcriptionModel === m.modelId}
                    onInput={() => {
                      props.setTranscriptionService(svc)
                      props.setTranscriptionModel(m.modelId)
                    }}
                  />
                  <label>{m.modelId}</label>
                  <div>{(m.cost * 500).toFixed(1)} credits ({m.cost}¢)</div>
                </div>
              )}
            </For>
          </div>
        )}
      </For>
      <br /><br />
      <div class="form-group">
        <label for="transcriptionApiKey">Transcription API Key</label>
        <input
          type="password"
          id="transcriptionApiKey"
          value={props.transcriptionApiKey}
          onInput={e => props.setTranscriptionApiKey(e.target.value)}
        />
      </div>
      <button disabled={props.isLoading} onClick={handleStepTwo}>
        {props.isLoading ? 'Transcribing...' : 'Generate Transcription'}
      </button>
    </>
  )
}