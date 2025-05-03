// src/components/groups/TranscriptionService.tsx

import { createSignal, For, Show } from 'solid-js'
import type { Setter } from 'solid-js'
import { PROMPT_CHOICES } from '../../types.ts'
import type { TranscriptionCosts } from '../../types.ts'

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
  selectedPrompts: string[]
  setSelectedPrompts: Setter<string[]>
  setLlmCosts: Setter<Record<string, any>>
  setPromptText: Setter<string>
  setCurrentStep: Setter<number>
}) => {
  const [showTranscript, setShowTranscript] = createSignal(false)
  const [transcriptData, setTranscriptData] = createSignal('')
  
  const formatContent = (text: string) => {
    return text.split('\n').map((line, _index) => (
      <>
        {line}
        <br />
      </>
    ))
  }
  
  const handleStepTwo = async (): Promise<void> => {
    console.log(`[TranscriptionStep] Starting transcription with ${props.transcriptionService}/${props.transcriptionModel}`)
    props.setIsLoading(true)
    props.setError(null)
    props.setTranscriptContent('')
    props.setPromptText('')
    
    try {
      const rtBody = {
        finalPath: props.finalPath,
        transcriptServices: props.transcriptionService,
        options: {
          prompt: props.selectedPrompts
        }
      } as {
        finalPath: string
        transcriptServices: string
        options: Record<string, unknown>
      }
      
      rtBody.options[props.transcriptionService] = props.transcriptionModel
      
      if (props.transcriptionService === 'assembly') {
        rtBody.options.assemblyApiKey = props.transcriptionApiKey
      }
      if (props.transcriptionService === 'deepgram') {
        rtBody.options.deepgramApiKey = props.transcriptionApiKey
      }
      
      console.log(`[TranscriptionStep] Sending request to run-transcription API`)
      
      const rtRes = await fetch('http://localhost:4321/api/run-transcription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rtBody)
      })
      
      if (!rtRes.ok) {
        const errorData = await rtRes.json()
        console.error(`[TranscriptionStep] Transcription API error:`, errorData)
        throw new Error(`Error running transcription: ${errorData.error || rtRes.statusText}`)
      }
      
      const rtData = await rtRes.json() as {
        transcript?: string
        prompt?: string
        modelId?: string
        transcriptionCost?: number
        allLLMCosts?: Record<string, any>
      }
      
      props.setTranscriptContent(rtData.transcript || '')
      setTranscriptData(rtData.transcript || '')
      props.setPromptText(rtData.prompt || '')
      
      if (rtData.modelId) {
        props.setTranscriptionModelUsed(rtData.modelId)
      }
      
      if (rtData.transcriptionCost != null) {
        props.setTranscriptionCostUsed(rtData.transcriptionCost)
      }
      
      if (rtData.allLLMCosts) {
        props.setLlmCosts(rtData.allLLMCosts)
      } else {
        console.warn(`[TranscriptionStep] No allLLMCosts found in response`)
        props.setLlmCosts({})
      }
      
      setShowTranscript(true)
      
      console.log(`[TranscriptionStep] Successfully completed transcription, moving to step 3`)
      props.setCurrentStep(3)
    } catch (err) {
      console.error(`[TranscriptionStep] Error in handleStepTwo:`, err)
      if (err instanceof Error) {
        props.setError(err.message)
      } else {
        props.setError('An unknown error occurred.')
      }
    } finally {
      props.setIsLoading(false)
    }
  }
  
  return (
    <>
      <h2>Select a Transcription Service and Prompts</h2>
      <div style={{ display: 'flex', 'flex-direction': 'column', gap: '20px' }}>
        <div>
          <h3>Transcription Service</h3>
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
                      <div>{(m.cost * 1000).toFixed(1)} Credits</div>
                      <div>¢{(m.cost).toFixed(3)}</div>
                    </div>
                  )}
                </For>
              </div>
            )}
          </For>
        </div>
        <div class="form-group">
          <label for="transcriptionApiKey">Transcription API Key</label>
          <input
            type="password"
            id="transcriptionApiKey"
            value={props.transcriptionApiKey}
            onInput={e => props.setTranscriptionApiKey(e.target.value)}
          />
        </div>
        <div class="form-group">
          <h3>Select Prompts</h3>
          <div class="checkbox-group">
            <For each={PROMPT_CHOICES}>
              {prompt => (
                <div>
                  <input
                    type="checkbox"
                    id={`prompt-${prompt.value}`}
                    value={prompt.value}
                    checked={props.selectedPrompts.includes(prompt.value)}
                    onInput={e => {
                      const isChecked = e.target.checked
                      if (isChecked) {
                        props.setSelectedPrompts([...props.selectedPrompts, prompt.value])
                      } else {
                        props.setSelectedPrompts(props.selectedPrompts.filter(p => p !== prompt.value))
                      }
                    }}
                  />
                  <label for={`prompt-${prompt.value}`}>{prompt.name}</label>
                </div>
              )}
            </For>
          </div>
        </div>
      </div>
      <button
        disabled={props.isLoading}
        onClick={handleStepTwo}
        style={{ 'margin-top': '20px' }}
      >
        {props.isLoading ? 'Transcribing...' : 'Generate Transcription & Continue to LLM Selection'}
      </button>
      <Show when={showTranscript() && transcriptData()}>
        <div style={{ 'margin-top': '20px' }}>
          <h3>Generated Transcript</h3>
          <div style={{ border: '1px solid #ccc', padding: '10px', 'max-height': '200px', overflow: 'auto' }}>
            {formatContent(transcriptData())}
          </div>
        </div>
      </Show>
    </>
  )
}