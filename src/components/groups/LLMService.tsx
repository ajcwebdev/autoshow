// src/components/groups/LLMService.tsx

import { createSignal, For, Show } from 'solid-js'
import { L_CONFIG } from '../../types.ts'
import type { LLMServiceKey, ShowNoteType, ShowNoteMetadata, LocalResult } from '../../types.ts'
const l = console.log
const err = console.error
export const LLMServiceStep = (props: {
  isLoading: boolean
  setIsLoading: (value: boolean) => void
  setError: (value: string | null) => void
  llmService: LLMServiceKey
  setLlmService: (value: LLMServiceKey) => void
  llmModel: string
  setLlmModel: (value: string) => void
  llmApiKey: string
  setLlmApiKey: (value: string) => void
  frontMatter: string
  promptText: string
  transcript: string
  transcriptionService: string
  transcriptionModelUsed: string
  transcriptionCostUsed: number | null
  metadata: Partial<ShowNoteMetadata>
  onNewShowNote: () => void
  llmCosts: Record<string, any>
  showNoteId: number
}) => {
  const [localResult, setLocalResult] = createSignal<LocalResult | null>(null)
  const allServices = () => Object.values(L_CONFIG).filter(s => s.value)
  const handleSelectLLM = async (): Promise<void> => {
    l('[LLMServiceStep] Starting LLM generation process')
    props.setIsLoading(true)
    props.setError(null)
    setLocalResult(null)
    try {
      const serviceCosts = props.llmCosts[props.llmService as string]
      const modelCostData = Array.isArray(serviceCosts)
        ? serviceCosts.find((x: any) => x.modelId === props.llmModel)
        : null
      const cost = modelCostData?.cost ?? 0
      const runLLMBody = {
        showNoteId: props.showNoteId.toString(),
        llmServices: props.llmService,
        options: {
          frontMatter: props.frontMatter,
          promptText: props.promptText,
          transcript: props.transcript,
          openaiApiKey: props.llmService === 'chatgpt' ? props.llmApiKey : undefined,
          anthropicApiKey: props.llmService === 'claude' ? props.llmApiKey : undefined,
          geminiApiKey: props.llmService === 'gemini' ? props.llmApiKey : undefined,
          groqApiKey: props.llmService === 'groq' ? props.llmApiKey : undefined,
          [props.llmService]: props.llmModel,
          transcriptionServices: props.transcriptionService,
          transcriptionModel: props.transcriptionModelUsed,
          transcriptionCost: props.transcriptionCostUsed,
          metadata: props.metadata,
          llmCost: cost
        }
      } as {
        showNoteId: string
        llmServices: string
        options: Record<string, unknown>
      }
      Object.keys(runLLMBody.options).forEach(key => {
        if (runLLMBody.options[key] === undefined) {
          delete runLLMBody.options[key]
        }
      })
      l(`[LLMServiceStep] Sending API request to run-llm with showNoteId: ${props.showNoteId}`)
      const runLLMRes = await fetch('http://localhost:4321/api/run-llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(runLLMBody)
      })
      if (!runLLMRes.ok) {
        const errorData = await runLLMRes.json()
        err(`[LLMServiceStep] API error: ${errorData.error || runLLMRes.statusText}`)
        throw new Error(`Error running LLM: ${errorData.error || runLLMRes.statusText}`)
      }
      const data = await runLLMRes.json() as {
        showNote: ShowNoteType
        showNotesResult: string
      }
      l(`[LLMServiceStep] Successfully generated show note with ID: ${data.showNote?.id}`)
      setLocalResult({ showNote: data.showNote, llmOutput: data.showNotesResult })
      props.onNewShowNote()
    } catch (error) {
      err(`[LLMServiceStep] Error in handleSelectLLM:`, error)
      if (error instanceof Error) {
        props.setError(error.message)
      } else {
        props.setError('An unknown error occurred.')
      }
    } finally {
      props.setIsLoading(false)
    }
  }
  l(`[LLMServiceStep] Rendering LLM service step, current service: ${props.llmService}`)
  return (
    <div class="space-y-6">
      <Show when={!Object.keys(L_CONFIG).length}>
        <p class="text-muted-foreground">No LLM config available</p>
      </Show>
      <Show when={allServices().length === 0}>
        <p class="text-muted-foreground">No services found</p>
      </Show>
      <Show when={allServices().length > 0}>
        <h2 class="h2">Select an LLM Model</h2>
        <div class="grid gap-6">
          <For each={allServices()}>
            {service => (
              <div class="bg-base-800 p-4 rounded-md">
                <h3 class="h3 text-primary-400 mb-4">{service.label}</h3>
                <Show when={!service.models || service.models.length === 0}>
                  <p class="text-muted-foreground">No models for {service.label}</p>
                </Show>
                <div class="grid gap-2">
                  <For each={service.models || []}>
                    {m => {
                      const serviceCosts = props.llmCosts[service.value as string]
                      const modelCostData = Array.isArray(serviceCosts)
                        ? serviceCosts.find((x: any) => x.modelId === m.modelId)
                        : null
                      const modelCost = modelCostData?.cost ?? 0
                      return (
                        <div class="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="llmChoice"
                            value={`${service.value}:${m.modelId}`}
                            checked={props.llmService === service.value && props.llmModel === m.modelId}
                            onInput={() => {
                              props.setLlmService(service.value as LLMServiceKey)
                              props.setLlmModel(m.modelId)
                            }}
                            class="text-primary-500 focus:ring-primary-500"
                          />
                          <div class="flex-1">
                            <label class="text-sm font-medium">{m.modelName}</label>
                            <div class="text-sm text-muted-foreground">
                              {(modelCost * 1000).toFixed(1)} Credits (¢{(modelCost).toFixed(3)})
                            </div>
                          </div>
                        </div>
                      )
                    }}
                  </For>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
      <div class="space-y-2">
        <label for="llmApiKey" class="block text-sm font-medium text-foreground">LLM API Key</label>
        <input
          type="password"
          id="llmApiKey"
          value={props.llmApiKey}
          onInput={e => props.setLlmApiKey(e.target.value)}
          class="form__input w-full py-2"
        />
      </div>
      <button 
        disabled={props.isLoading} 
        onClick={handleSelectLLM}
        class="button button--primary"
      >
        {props.isLoading ? 'Generating Show Notes...' : 'Generate Show Notes'}
      </button>
      <Show when={localResult()}>
        <div class="space-y-4">
          <div>
            <h3 class="h3 mb-3">Show Note Result</h3>
            <pre class="bg-base-800 p-4 rounded-md overflow-auto text-sm">
              {JSON.stringify(localResult()!.showNote, null, 2)}
            </pre>
          </div>
          <div>
            <h3 class="h3 mb-3">LLM Output Text</h3>
            <div class="bg-base-800 p-4 rounded-md whitespace-pre-wrap">
              {localResult()!.llmOutput}
            </div>
          </div>
        </div>
      </Show>
    </div>
  )
}