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
  const logPrefix = '[TranscriptionStep]'
  const [showTranscript, setShowTranscript] = createSignal(false)
  const [transcriptData, setTranscriptData] = createSignal('')
  
  console.log(`${logPrefix} Component initialized`)
  console.log(`${logPrefix} Initial showTranscript: ${showTranscript()}`)
  console.log(`${logPrefix} Initial transcriptData: ""`)
  console.log(`${logPrefix} Initial selectedPrompts: ${props.selectedPrompts.join(', ')}`)

  const formatContent = (text: string) => {
    console.log(`${logPrefix} Formatting content (length: ${text.length})`)
    return text.split('\n').map((line, _index) => (
      <>
        {line}
        <br />
      </>
    ))
  }

  const handleStepTwo = async (): Promise<void> => {
    console.log(`${logPrefix} handleStepTwo called`)
    props.setIsLoading(true)
    console.log(`${logPrefix} isLoading set to true`)
    props.setError(null)
    console.log(`${logPrefix} error set to null`)
    props.setTranscriptContent('')
    console.log(`${logPrefix} transcriptContent reset`)
    props.setPromptText('')
    console.log(`${logPrefix} promptText reset`)
    
    try {
      console.log(`${logPrefix} Selected prompts: ${props.selectedPrompts.join(', ')}`)
      
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
      console.log(`${logPrefix} Set model option: ${props.transcriptionService}=${props.transcriptionModel}`)
      
      if (props.transcriptionService === 'assembly') {
        rtBody.options.assemblyApiKey = props.transcriptionApiKey
        console.log(`${logPrefix} Added assemblyApiKey option`)
      }
      
      if (props.transcriptionService === 'deepgram') {
        rtBody.options.deepgramApiKey = props.transcriptionApiKey
        console.log(`${logPrefix} Added deepgramApiKey option`)
      }
      
      console.log(`${logPrefix} Sending request to /api/run-transcription with body:`, JSON.stringify(rtBody))
      const rtRes = await fetch('http://localhost:4321/api/run-transcription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rtBody)
      })
      
      console.log(`${logPrefix} Received response from /api/run-transcription with status ${rtRes.status}`)
      
      if (!rtRes.ok) {
        const errorData = await rtRes.json()
        console.error(`${logPrefix} Run transcription error response:`, errorData)
        throw new Error(`Error running transcription: ${errorData.error || rtRes.statusText}`)
      }
      
      const rtData = await rtRes.json() as {
        transcript?: string
        prompt?: string
        modelId?: string
        transcriptionCost?: number
        allLLMCosts?: Record<string, any>
      }
      
      console.log(`${logPrefix} Successfully parsed response from /api/run-transcription:`, rtData)
      
      props.setTranscriptContent(rtData.transcript || '')
      console.log(`${logPrefix} Set transcriptContent (length: ${rtData.transcript?.length ?? 0})`)
      setTranscriptData(rtData.transcript || '')
      console.log(`${logPrefix} Set local transcriptData (length: ${rtData.transcript?.length ?? 0})`)
      
      props.setPromptText(rtData.prompt || '')
      console.log(`${logPrefix} Set promptText (length: ${rtData.prompt?.length ?? 0})`)
      
      if (rtData.modelId) {
        props.setTranscriptionModelUsed(rtData.modelId)
        console.log(`${logPrefix} Set transcriptionModelUsed: ${rtData.modelId}`)
      }
      
      if (rtData.transcriptionCost != null) {
        props.setTranscriptionCostUsed(rtData.transcriptionCost)
        console.log(`${logPrefix} Set transcriptionCostUsed: ${rtData.transcriptionCost}`)
      }
      
      if (rtData.allLLMCosts) {
        props.setLlmCosts(rtData.allLLMCosts)
        console.log(`${logPrefix} Set llmCosts:`, rtData.allLLMCosts)
      } else {
        console.warn(`${logPrefix} No allLLMCosts found in response`)
        props.setLlmCosts({})
      }
      
      setShowTranscript(true)
      console.log(`${logPrefix} Set showTranscript to true`)
      
      props.setCurrentStep(3)
      console.log(`${logPrefix} Set currentStep to 3 (LLM service step)`)
    } catch (err) {
      console.error(`${logPrefix} Error in handleStepTwo:`, err)
      if (err instanceof Error) {
        props.setError(err.message)
        console.log(`${logPrefix} Set error state to: ${err.message}`)
      } else {
        props.setError('An unknown error occurred.')
        console.log(`${logPrefix} Set error state to: An unknown error occurred.`)
      }
    } finally {
      props.setIsLoading(false)
      console.log(`${logPrefix} isLoading set to false in finally block`)
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
                          console.log(`${logPrefix} Transcription choice changed: ${svc}:${m.modelId}`)
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
            onInput={e => {
              console.log(`${logPrefix} Transcription API key input changed`)
              props.setTranscriptionApiKey(e.target.value)
            }}
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
                      console.log(`${logPrefix} Prompt checkbox '${prompt.value}' changed: ${isChecked}`)
                      
                      if (isChecked) {
                        props.setSelectedPrompts([...props.selectedPrompts, prompt.value])
                        console.log(`${logPrefix} Added '${prompt.value}' to selectedPrompts`)
                      } else {
                        props.setSelectedPrompts(props.selectedPrompts.filter(p => p !== prompt.value))
                        console.log(`${logPrefix} Removed '${prompt.value}' from selectedPrompts`)
                      }
                      
                      console.log(`${logPrefix} Current selectedPrompts: ${props.selectedPrompts.join(', ')}`)
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