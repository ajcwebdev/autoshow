// src/components/groups/LLMService.tsx

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
  // finalMarkdownFile removed
  frontMatter: string // Added prop
  promptText: string // Added prop
  transcript: string // Added prop
  transcriptionService: string
  transcriptionModelUsed: string
  transcriptionCostUsed: number | null
  metadata: Partial<ShowNoteMetadata>
  onNewShowNote: () => void
  llmCosts: Record<string, any>
}) => {
  const logPrefix = '[LLMServiceStep]'
  const [localResult, setLocalResult] = createSignal<LocalResult | null>(null)
  const allServices = () => Object.values(L_CONFIG).filter(s => s.value)
  const handleSelectLLM = async (): Promise<void> => {
    console.log(`${logPrefix} handleSelectLLM called`)
    props.setIsLoading(true)
    console.log(`${logPrefix} isLoading set to true`)
    props.setError(null)
    console.log(`${logPrefix} error set to null`)
    setLocalResult(null)
    console.log(`${logPrefix} localResult reset`)
    try {
      // Find cost for selected model
      const serviceCosts = props.llmCosts[props.llmService as string]
      const modelCostData = Array.isArray(serviceCosts)
        ? serviceCosts.find((x: any) => x.modelId === props.llmModel)
        : null
      const cost = modelCostData?.cost ?? 0
      console.log(`${logPrefix} Calculated cost for ${props.llmService} / ${props.llmModel}: ${cost}`)
      const runLLMBody = {
        // filePath removed
        llmServices: props.llmService,
        options: {
          // Pass content directly
          frontMatter: props.frontMatter,
          promptText: props.promptText, // Use renamed prop
          transcript: props.transcript,
          // API Keys
          openaiApiKey: props.llmService === 'chatgpt' ? props.llmApiKey : undefined,
          anthropicApiKey: props.llmService === 'claude' ? props.llmApiKey : undefined,
          geminiApiKey: props.llmService === 'gemini' ? props.llmApiKey : undefined,
          groqApiKey: props.llmService === 'groq' ? props.llmApiKey : undefined,
          // Selected model
          [props.llmService]: props.llmModel,
          // Transcription info
          transcriptionServices: props.transcriptionService,
          transcriptionModel: props.transcriptionModelUsed,
          transcriptionCost: props.transcriptionCostUsed,
          // Other metadata
          metadata: props.metadata,
          // Costs
          llmCost: cost
        }
      } as {
        // filePath removed
        llmServices: string
        options: Record<string, unknown>
      }
      // Clean undefined keys from options for cleaner logs/requests
      Object.keys(runLLMBody.options).forEach(key => {
        if (runLLMBody.options[key] === undefined) {
          delete runLLMBody.options[key]
        }
      })
      console.log(`${logPrefix} Sending request to /api/run-llm`)
      // Avoid logging full body if it contains sensitive info like API keys or large text blobs
      console.log(`${logPrefix} Request Body Keys: ${Object.keys(runLLMBody)}`)
      console.log(`${logPrefix} Request Options Keys: ${Object.keys(runLLMBody.options)}`)
      console.log(`${logPrefix} Request FrontMatter length: ${props.frontMatter.length}`)
      console.log(`${logPrefix} Request PromptText length: ${props.promptText.length}`)
      console.log(`${logPrefix} Request Transcript length: ${props.transcript.length}`)
      const runLLMRes = await fetch('http://localhost:4321/api/run-llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(runLLMBody)
      })
      console.log(`${logPrefix} Received response from /api/run-llm with status ${runLLMRes.status}`)
      if (!runLLMRes.ok) {
        const errorData = await runLLMRes.json()
        console.error(`${logPrefix} Run LLM error response:`, errorData)
        throw new Error(`Error running LLM: ${errorData.error || runLLMRes.statusText}`)
      }
      const data = await runLLMRes.json() as {
        showNote: ShowNoteType
        showNotesResult: string
      }
      console.log(`${logPrefix} Successfully parsed response from /api/run-llm`)
      console.log(`${logPrefix} Received showNote ID: ${data.showNote?.id}`)
      console.log(`${logPrefix} Received showNotesResult length: ${data.showNotesResult?.length ?? 0}`)
      setLocalResult({ showNote: data.showNote, llmOutput: data.showNotesResult })
      console.log(`${logPrefix} Set localResult state`)
      props.onNewShowNote()
      console.log(`${logPrefix} Called onNewShowNote callback`)
    } catch (err) {
      console.error(`${logPrefix} Error in handleSelectLLM:`, err)
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
                  // console.log(`${logPrefix} Rendering model ${m.modelId}, cost: ${modelCost}`) // Too verbose for render loop
                  return (
                    <div>
                      <input
                        type="radio"
                        name="llmChoice"
                        value={`<span class="math-inline">\{service\.value\}\:</span>{m.modelId}`}
                        checked={props.llmService === service.value && props.llmModel === m.modelId}
                        onInput={() => {
                          console.log(`${logPrefix} LLM choice changed: <span class="math-inline">\{service\.value\}\:</span>{m.modelId}`)
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
          onInput={e => {
            console.log(`${logPrefix} LLM API Key input changed`)
            props.setLlmApiKey(e.target.value)
          }}
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