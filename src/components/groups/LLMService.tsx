// web/src/components/groups/LLMService.tsx

import { createSignal, For, Show } from 'solid-js'
import { L_CONFIG } from '../../constants.ts'
import type { LLMServiceKey, ShowNoteType, ShowNoteMetadata, LocalResult } from '../../types.ts'

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
  finalMarkdownFile: string
  transcriptionService: string
  transcriptionModelUsed: string
  transcriptionCostUsed: number | null
  metadata: Partial<ShowNoteMetadata>
  onNewShowNote: () => void
  llmCosts: Record<string, any>
}) => {
  const [localResult, setLocalResult] = createSignal<LocalResult | null>(null)
  const allServices = () => Object.values(L_CONFIG).filter(s => s.value)

  const handleSelectLLM = async () => {
    props.setIsLoading(true)
    props.setError(null)
    setLocalResult(null)
    try {
      const cost = props.llmCosts[props.llmService as string]?.find((x: any) => x.modelId === props.llmModel)?.cost ?? 0
      const runLLMBody = {
        filePath: props.finalMarkdownFile,
        llmServices: props.llmService,
        options: {}
      } as {
        filePath: string
        llmServices: string
        options: Record<string, unknown>
      }
      if (props.llmService === 'chatgpt') runLLMBody.options.openaiApiKey = props.llmApiKey
      if (props.llmService === 'claude') runLLMBody.options.anthropicApiKey = props.llmApiKey
      if (props.llmService === 'gemini') runLLMBody.options.geminiApiKey = props.llmApiKey
      if (props.llmService === 'groq') runLLMBody.options.groqApiKey = props.llmApiKey
      runLLMBody.options[props.llmService] = props.llmModel
      runLLMBody.options.transcriptionServices = props.transcriptionService
      runLLMBody.options.transcriptionModel = props.transcriptionModelUsed
      runLLMBody.options.transcriptionCost = props.transcriptionCostUsed
      runLLMBody.options.metadata = props.metadata
      runLLMBody.options.llmCost = cost
      const runLLMRes = await fetch('http://localhost:4321/api/run-llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(runLLMBody)
      })
      if (!runLLMRes.ok) throw new Error('Error running LLM')
      const data = await runLLMRes.json() as {
        showNote: ShowNoteType
        showNotesResult: string
      }
      setLocalResult({ showNote: data.showNote, llmOutput: data.showNotesResult })
      props.onNewShowNote()
    } catch (err) {
      if (err instanceof Error) props.setError(err.message)
      else props.setError('An unknown error occurred.')
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
              <Show when={service.models && service.models.length === 0}>
                <p>No models for {service.label}</p>
              </Show>
              <For each={service.models || []}>
                {m => {
                  const modelCost = props.llmCosts[service.value as string]?.find((x: any) => x.modelId === m.modelId)?.cost ?? 0
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
          <h3>Show Note</h3>
          <pre>{JSON.stringify(localResult()!.showNote, null, 2)}</pre>
          <h3>LLM Output</h3>
          <p>{localResult()!.llmOutput}</p>
        </div>
      </Show>
    </>
  )
}