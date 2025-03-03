// web/src/components/app/groups/LLMService.tsx

import React from 'react'
import { LLM_SERVICES_CONFIG } from '../../../../../shared/constants'

// Define the LLMServiceKey type
type LLMServiceKey = keyof typeof LLM_SERVICES_CONFIG;

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
  llmService: LLMServiceKey
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
   * Automatically set the first model from the chosen service's array if none is selected.
   */
  React.useEffect(() => {
    if (llmService && LLM_SERVICES_CONFIG[llmService]?.models?.length && !llmModel) {
      setLlmModel(LLM_SERVICES_CONFIG[llmService].models[0].modelId)
    }
  }, [llmService, llmModel, setLlmModel])

  // Build an array of services from the config (excluding "skip" which has null value)
  const allServices = Object.values(LLM_SERVICES_CONFIG).filter((s) => s.value)

  // Get the models for the selected service
  const modelsForService = llmService
    ? LLM_SERVICES_CONFIG[llmService]?.models ?? []
    : []

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
          {allServices.map((service) => (
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
            onChange={(e) => setLlmModel(e.target.value)}
          >
            {modelsForService.map((model) => (
              <option key={model.modelId} value={model.modelId}>
                {model.modelName}
              </option>
            ))}
          </select>
        </div>
      )}
    </>
  )
}