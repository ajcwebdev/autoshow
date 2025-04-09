// web/src/components/groups/LLMService.tsx

import React from 'react'
import { L_CONFIG } from '../../../../shared/constants.ts'
import type { LLMServiceKey } from '../../../../shared/types.ts'

export const LLMService: React.FC<{
 llmService: LLMServiceKey
 setLlmService: React.Dispatch<React.SetStateAction<LLMServiceKey>>
 llmModel: string
 setLlmModel: React.Dispatch<React.SetStateAction<string>>
 llmApiKey: string
 setLlmApiKey: React.Dispatch<React.SetStateAction<string>>
 selectedLlmApiKeyService: string
 setSelectedLlmApiKeyService: React.Dispatch<React.SetStateAction<string>>
}> = ({
 llmService,
 setLlmService,
 llmModel,
 setLlmModel,
 llmApiKey,
 setLlmApiKey,
 selectedLlmApiKeyService,
 setSelectedLlmApiKeyService
}) => {
 const allServices = Object.values(L_CONFIG).filter((s) => s.value)
 const modelsForService = llmService
   ? L_CONFIG[llmService]?.models ?? []
   : []

 return (
   <>
     <div className="form-group">
       <label htmlFor="llmService">LLM Service</label>
       <select
         id="llmService"
         value={llmService}
         onChange={(e) => {
           setLlmService(e.target.value as LLMServiceKey)
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

     {llmService && (
       <>
         <div className="form-group">
           <label htmlFor="llmApiKeyService">LLM API Key Service</label>
           <select
             id="llmApiKeyService"
             value={selectedLlmApiKeyService}
             onChange={(e) => setSelectedLlmApiKeyService(e.target.value)}
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
             onChange={(e) => setLlmApiKey(e.target.value)}
           />
         </div>
       </>
     )}
   </>
 )
}