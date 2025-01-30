// web/src/components/app/groups/LLMService.tsx

import React from 'react'
import { LLM_SERVICES, LLM_MODELS } from '@/site-config'
import type { LlmServiceKey } from '../../../types'

/**
 * The LLMService component provides a dropdown for selecting the LLM service,
 * and conditionally displays a second dropdown for choosing a model based on
 * the selected service.
 *
 * @param {{
 *   llmService: string,
 *   setLlmService: React.Dispatch<React.SetStateAction<string>>,
 *   llmModel: string,
 *   setLlmModel: React.Dispatch<React.SetStateAction<string>>
 * }} props
 * @returns {JSX.Element}
 */
export const LLMService: React.FC<{
  llmService: string
  setLlmService: React.Dispatch<React.SetStateAction<string>>
  llmModel: string
  setLlmModel: React.Dispatch<React.SetStateAction<string>>
}> = ({
  llmService,
  setLlmService,
  llmModel,
  setLlmModel
}) => {
  /**
   * Automatically set the first model from LLM_MODELS if none is selected.
   * 
   * @remarks
   * Ensures a valid model is always sent to the backend if an LLM service has been chosen.
   */
  React.useEffect(() => {
    if (llmService && llmService in LLM_MODELS && !llmModel) {
      setLlmModel((LLM_MODELS[llmService as LlmServiceKey][0] as { value: string }).value)
    }
  }, [llmService, llmModel, setLlmModel])

  return (
    <>
      <div className="form-group">
        <label htmlFor="llmService">LLM Service</label>
        <select
          id="llmService"
          value={llmService}
          onChange={(e) => {
            setLlmService(e.target.value)
            setLlmModel('')
          }}
        >
          <option value="">None</option>
          {LLM_SERVICES.map((service) => (
            <option key={service.value} value={service.value}>
              {service.label}
            </option>
          ))}
        </select>
      </div>

      {llmService && llmService in LLM_MODELS && (
        <div className="form-group">
          <label htmlFor="llmModel">LLM Model</label>
          <select
            id="llmModel"
            value={llmModel}
            onChange={(e) => setLlmModel(e.target.value)}
          >
            {LLM_MODELS[llmService as LlmServiceKey].map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </>
  )
}