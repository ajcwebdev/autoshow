// web/src/components/groups/LLMService.tsx

import React, { useState } from 'react'
import { L_CONFIG } from '../../../../shared/constants.ts'
import type { LLMServiceKey } from '../../../../shared/types.ts'

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
  selectedLlmApiKeyService: string
  setSelectedLlmApiKeyService: React.Dispatch<React.SetStateAction<string>>
  finalMarkdownFile: string
  transcriptionService: string
  transcriptionModelUsed: string
  transcriptionCostUsed: number | null
  metadata: any
  onNewShowNote: () => void
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
  selectedLlmApiKeyService,
  setSelectedLlmApiKeyService,
  finalMarkdownFile,
  transcriptionService,
  transcriptionModelUsed,
  transcriptionCostUsed,
  metadata,
  onNewShowNote
}) => {
  const [localResult, setLocalResult] = useState(null)
  const allServices = Object.values(L_CONFIG).filter(s => s.value)
  const modelsForService = llmService
    ? L_CONFIG[llmService]?.models ?? []
    : []

  const handleSelectLLM = async () => {
    setIsLoading(true)
    setError(null)
    setLocalResult(null)
    try {
      const runLLMBody: any = {
        filePath: finalMarkdownFile,
        llmServices: llmService,
        options: {}
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
      const runLLMRes = await fetch('http://localhost:3000/run-llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(runLLMBody)
      })
      if (!runLLMRes.ok) throw new Error('Error running LLM')
      const data = await runLLMRes.json()
      setLocalResult(data.showNotesResult || '')
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
      <h3>Select an LLM Service</h3>
      <div>
        {Object.entries(L_CONFIG).map(([key, val]) => val.value && (
          <div key={key}>
          </div>
        ))}
      </div>
      <div>
        {!allServices.length && <p>No services found</p>}
        {allServices.length > 0 && (
          <div>
            {allServices.map(service => (
              <div key={service.value}>
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        {!modelsForService.length && <p>No models for selected service</p>}
        {Object.entries(L_CONFIG).length > 0 && (
          <div>
            {Object.entries(L_CONFIG).map(([svc, val]) => (
              svc === llmService && val.models.length > 0 ? (
                <div key={svc}>
                  {(val.models as any[]).map(m => (
                    <div key={m.modelId}>
                      <input
                        type="radio"
                        name="llmChoice"
                        value={`${svc}:${m.modelId}`}
                        checked={llmService === svc && llmModel === m.modelId}
                        onChange={() => {
                          setLlmService(svc as LLMServiceKey)
                          setLlmModel(m.modelId)
                        }}
                      />
                      <label>{m.modelId}</label>
                    </div>
                  ))}
                </div>
              ) : null
            ))}
          </div>
        )}
      </div>
      <div className="form-group">
        <label htmlFor="llmService">LLM Service</label>
        <select
          id="llmService"
          value={llmService}
          onChange={e => {
            setLlmService(e.target.value as LLMServiceKey)
            setLlmModel('')
          }}
        >
          <option value="">None</option>
          {allServices.map(service => (
            <option key={service.value} value={service.value as string}>
              {service.label}
            </option>
          ))}
        </select>
      </div>
      {llmService && modelsForService.length > 0 && (
        <div className="form-group">
          <label htmlFor="llmModel">LLM Model</label>
          <select
            id="llmModel"
            value={llmModel}
            onChange={e => setLlmModel(e.target.value)}
          >
            {modelsForService.map(model => (
              <option key={model.modelId} value={model.modelId}>
                {model.modelName}
              </option>
            ))}
          </select>
        </div>
      )}
      {llmService && (
        <>
          <div className="form-group">
            <label htmlFor="llmApiKeyService">LLM API Key Service</label>
            <select
              id="llmApiKeyService"
              value={selectedLlmApiKeyService}
              onChange={e => setSelectedLlmApiKeyService(e.target.value)}
            >
              <option value="chatgpt">ChatGPT</option>
              <option value="claude">Claude</option>
              <option value="gemini">Gemini</option>
              <option value="deepseek">Deepseek</option>
              <option value="together">Together</option>
              <option value="fireworks">Fireworks</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="llmApiKey">LLM API Key</label>
            <input
              type="text"
              id="llmApiKey"
              value={llmApiKey}
              onChange={e => setLlmApiKey(e.target.value)}
            />
          </div>
        </>
      )}
      <button disabled={isLoading} onClick={handleSelectLLM}>
        {isLoading ? 'Generating Show Notes...' : 'Generate Show Notes'}
      </button>
      {localResult && (
        <div className="result">
          <h3>LLM Output</h3>
          <p>{localResult}</p>
        </div>
      )}
    </>
  )
}
