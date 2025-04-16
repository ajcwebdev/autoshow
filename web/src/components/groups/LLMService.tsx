// web/src/components/groups/LLMService.tsx

import React, { useState } from 'react'
import { L_CONFIG } from '../../../../shared/constants.ts'
import type { LLMServiceKey, ShowNoteType, ShowNoteMetadata, LocalResult } from '../../../../shared/types.ts'

export const LLMServiceStep: React.FC<{
  isLoading: boolean
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
  setError: React.Dispatch<React.SetStateAction<string | null>>
  llmService: LLMServiceKey
  setLlmService: React.Dispatch<React.SetStateAction<LLMServiceKey>>
  llmModel: string
  setLlmModel: React.Dispatch<React.SetStateAction<string>>
  llmApiKey: string
  setLlmApiKey: React.Dispatch<React.SetStateAction<string>>
  finalMarkdownFile: string
  transcriptionService: string
  transcriptionModelUsed: string
  transcriptionCostUsed: number | null
  metadata: Partial<ShowNoteMetadata>
  onNewShowNote: () => void
  llmCosts: Record<string, any>
}> = ({
  isLoading,
  setIsLoading,
  setError,
  llmService,
  setLlmService,
  llmModel,
  setLlmModel,
  llmApiKey,
  setLlmApiKey,
  finalMarkdownFile,
  transcriptionService,
  transcriptionModelUsed,
  transcriptionCostUsed,
  metadata,
  onNewShowNote,
  llmCosts
}) => {
  const [localResult, setLocalResult] = useState<LocalResult | null>(null)
  const allServices = Object.values(L_CONFIG).filter(s => s.value)

  const handleSelectLLM = async () => {
    setIsLoading(true)
    setError(null)
    setLocalResult(null)
    try {
      const cost = llmCosts[llmService as string]?.find((x: any) => x.modelId === llmModel)?.cost ?? 0
      const runLLMBody = {
        filePath: finalMarkdownFile,
        llmServices: llmService,
        options: {}
      } as {
        filePath: string
        llmServices: string
        options: Record<string, unknown>
      }
      if (llmService === 'chatgpt') runLLMBody.options.openaiApiKey = llmApiKey
      if (llmService === 'claude') runLLMBody.options.anthropicApiKey = llmApiKey
      if (llmService === 'gemini') runLLMBody.options.geminiApiKey = llmApiKey
      if (llmService === 'deepseek') runLLMBody.options.deepseekApiKey = llmApiKey
      if (llmService === 'together') runLLMBody.options.togetherApiKey = llmApiKey
      if (llmService === 'fireworks') runLLMBody.options.fireworksApiKey = llmApiKey
      runLLMBody.options[llmService] = llmModel
      runLLMBody.options.transcriptionServices = transcriptionService
      runLLMBody.options.transcriptionModel = transcriptionModelUsed
      runLLMBody.options.transcriptionCost = transcriptionCostUsed
      runLLMBody.options.metadata = metadata
      runLLMBody.options.llmCost = cost
      const runLLMRes = await fetch('http://localhost:3000/run-llm', {
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
      onNewShowNote()
    } catch (err) {
      if (err instanceof Error) setError(err.message)
      else setError('An unknown error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {!Object.keys(L_CONFIG).length && <p>No LLM config available</p>}
      {allServices.length === 0 && <p>No services found</p>}
      {allServices.length > 0 && (
        <>
          <h2>Select an LLM Model</h2>
          {allServices.map(service => (
            <div key={service.value}>
              <h3>{service.label}</h3>
              {service.models && service.models.length === 0 && <p>No models for {service.label}</p>}
              {service.models && service.models.map(m => {
                const modelCost = llmCosts[service.value as string]?.find((x: any) => x.modelId === m.modelId)?.cost ?? 0
                return (
                  <div key={m.modelId}>
                    <input
                      type="radio"
                      name="llmChoice"
                      value={`${service.value}:${m.modelId}`}
                      checked={llmService === service.value && llmModel === m.modelId}
                      onChange={() => {
                        setLlmService(service.value as LLMServiceKey)
                        setLlmModel(m.modelId)
                      }}
                    />
                    <label>{m.modelName}</label>
                    <div>{(modelCost * 500).toFixed(1)} credits ({modelCost}¢)</div>
                  </div>
                )
              })}
            </div>
          ))}
        </>
      )}
      <br /><br />
      <div className="form-group">
        <label htmlFor="llmApiKey">LLM API Key</label>
        <input
          type="password"
          id="llmApiKey"
          value={llmApiKey}
          onChange={e => setLlmApiKey(e.target.value)}
        />
      </div>
      <button disabled={isLoading} onClick={handleSelectLLM}>
        {isLoading ? 'Generating Show Notes...' : 'Generate Show Notes'}
      </button>
      {localResult && (
        <div className="result">
          <h3>Show Note</h3>
          <pre>{JSON.stringify(localResult.showNote, null, 2)}</pre>
          <h3>LLM Output</h3>
          <p>{localResult.llmOutput}</p>
        </div>
      )}
    </>
  )
}