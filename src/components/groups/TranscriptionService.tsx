// src/components/groups/TranscriptionService.tsx

import { createSignal, For, Show } from 'solid-js'
import type { Setter } from 'solid-js'
import { PROMPT_CHOICES } from '../../types.ts'
import type { TranscriptionCosts } from '../../types.ts'
const l = console.log
const err = console.error
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
  s3Url: string
  setTranscriptContent: Setter<string>
  setTranscriptionModelUsed: Setter<string>
  setTranscriptionCostUsed: Setter<number | null>
  transcriptionCosts: TranscriptionCosts
  selectedPrompts: string[]
  setSelectedPrompts: Setter<string[]>
  setLlmCosts: Setter<Record<string, any>>
  setPromptText: Setter<string>
  setCurrentStep: Setter<number>
  showNoteId: number
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
    l(`[TranscriptionStep] Starting transcription with ${props.transcriptionService}/${props.transcriptionModel}`)
    props.setIsLoading(true)
    props.setError(null)
    props.setTranscriptContent('')
    props.setPromptText('')
    try {
      const rtBody = {
        showNoteId: props.showNoteId.toString(),
        finalPath: props.finalPath,
        s3Url: props.s3Url,
        transcriptServices: props.transcriptionService,
        options: {
          prompt: props.selectedPrompts
        }
      } as {
        showNoteId: string
        finalPath: string
        s3Url: string
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
      l(`[TranscriptionStep] Sending request to run-transcription API with showNoteId: ${props.showNoteId}`)
      const rtRes = await fetch('http://localhost:4321/api/run-transcription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rtBody)
      })
      if (!rtRes.ok) {
        const errorData = await rtRes.json()
        err(`[TranscriptionStep] Transcription API error:`, errorData)
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
      l(`[TranscriptionStep] Successfully completed transcription, moving to step 3`)
      props.setCurrentStep(3)
    } catch (error) {
      err(`[TranscriptionStep] Error in handleStepTwo:`, error)
      if (error instanceof Error) {
        props.setError(error.message)
      } else {
        props.setError('An unknown error occurred.')
      }
    } finally {
      props.setIsLoading(false)
    }
  }
  l(`[TranscriptionStep] Rendering transcription step with service: ${props.transcriptionService}`)
  return (
    <div class="space-y-6">
      <h2 class="h2">Select a Transcription Service and Prompts</h2>
      <div class="space-y-6">
        <div>
          <h3 class="h3 mb-4">Transcription Service</h3>
          <Show when={!Object.keys(props.transcriptionCosts).length}>
            <p class="text-muted-foreground">No cost data available</p>
          </Show>
          <div class="grid gap-4">
            <For each={Object.entries(props.transcriptionCosts)}>
              {([svc, models]) => (
                <div class="bg-base-800 p-4 rounded-md">
                  <h4 class="font-medium text-primary-400 mb-3">{svc}</h4>
                  <div class="grid gap-2">
                    <For each={models}>
                      {m => (
                        <div class="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="transcriptionChoice"
                            value={`${svc}:${m.modelId}`}
                            checked={props.transcriptionService === svc && props.transcriptionModel === m.modelId}
                            onInput={() => {
                              props.setTranscriptionService(svc)
                              props.setTranscriptionModel(m.modelId)
                            }}
                            class="text-primary-500 focus:ring-primary-500"
                          />
                          <div class="flex-1">
                            <label class="text-sm font-medium">{m.modelId}</label>
                            <div class="text-sm text-muted-foreground">
                              {(m.cost * 1000).toFixed(1)} Credits (¢{(m.cost).toFixed(3)})
                            </div>
                          </div>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
        <div class="space-y-2">
          <label for="transcriptionApiKey" class="block text-sm font-medium text-foreground">Transcription API Key</label>
          <input
            type="password"
            id="transcriptionApiKey"
            value={props.transcriptionApiKey}
            onInput={e => props.setTranscriptionApiKey(e.target.value)}
            class="form__input w-full py-2"
          />
        </div>
        <div>
          <h3 class="h3 mb-4">Select Prompts</h3>
          <div class="grid grid-cols-2 gap-3">
            <For each={PROMPT_CHOICES}>
              {prompt => (
                <div class="flex items-center space-x-2">
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
                    class="text-primary-500 focus:ring-primary-500"
                  />
                  <label for={`prompt-${prompt.value}`} class="text-sm">{prompt.name}</label>
                </div>
              )}
            </For>
          </div>
        </div>
      </div>
      <button
        disabled={props.isLoading}
        onClick={handleStepTwo}
        class="button button--primary"
      >
        {props.isLoading ? 'Transcribing...' : 'Generate Transcription & Continue to LLM Selection'}
      </button>
      <Show when={showTranscript() && transcriptData()}>
        <div>
          <h3 class="h3 mb-3">Generated Transcript</h3>
          <div class="bg-base-800 p-4 rounded-md max-h-[300px] overflow-auto">
            {formatContent(transcriptData())}
          </div>
        </div>
      </Show>
    </div>
  )
}