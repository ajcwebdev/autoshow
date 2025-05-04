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
        llmServices: string
        options: Record<string, unknown>
      }
      
      Object.keys(runLLMBody.options).forEach(key => {
        if (runLLMBody.options[key] === undefined) {
          delete runLLMBody.options[key]
        }
      })

      l(`[LLMServiceStep] Sending API request to run-llm with ${props.llmService}/${props.llmModel}`)
      
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
  
  return (
    <>
      <Show when={!Object.keys(L_CONFIG).length}>
        <p>No LLM config available</p>
      </Show>
      <Show when={allServices().length === 0}>
        <p>No services found</p>
      </Show>
      <Show when={allServices().length > 0}>
        <h2>Select an LLM Model</h2>
        <For each={allServices()}>
          {service => (
            <div>
              <h3>{service.label}</h3>
              <Show when={!service.models || service.models.length === 0}>
                <p>No models for {service.label}</p>
              </Show>
              <For each={service.models || []}>
                {m => {
                  const serviceCosts = props.llmCosts[service.value as string]
                  const modelCostData = Array.isArray(serviceCosts)
                    ? serviceCosts.find((x: any) => x.modelId === m.modelId)
                    : null
                  const modelCost = modelCostData?.cost ?? 0
                  return (
                    <div>
                      <input
                        type="radio"
                        name="llmChoice"
                        value={`${service.value}:${m.modelId}`}
                        checked={props.llmService === service.value && props.llmModel === m.modelId}
                        onInput={() => {
                          props.setLlmService(service.value as LLMServiceKey)
                          props.setLlmModel(m.modelId)
                        }}
                      />
                      <label>{m.modelName}</label>
                      <div>{(modelCost * 1000).toFixed(1)} Credits</div>
                      <div>¢{(modelCost).toFixed(3)}</div>
                    </div>
                  )
                }}
              </For>
            </div>
          )}
        </For>
      </Show>
      <br /><br />
      <div class="form-group">
        <label for="llmApiKey">LLM API Key</label>
        <input
          type="password"
          id="llmApiKey"
          value={props.llmApiKey}
          onInput={e => props.setLlmApiKey(e.target.value)}
        />
      </div>
      <button disabled={props.isLoading} onClick={handleSelectLLM}>
        {props.isLoading ? 'Generating Show Notes...' : 'Generate Show Notes'}
      </button>
      <Show when={localResult()}>
        <div class="result">
          <h3>Show Note Result</h3>
          <pre>{JSON.stringify(localResult()!.showNote, null, 2)}</pre>
          <h3>LLM Output Text</h3>
          <p>{localResult()!.llmOutput}</p>
        </div>
      </Show>
    </>
  )
}