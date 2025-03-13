// web/src/components/groups/Prompts.tsx

import React from 'react'
import { PROMPT_CHOICES } from '../../../../shared/constants'

/**
 * The Prompts component contains checkboxes for all available prompts.
 * Users can select multiple prompts, which are stored in the selectedPrompts state.
 *
 * @param {{
 *   selectedPrompts: string[],
 *   setSelectedPrompts: React.Dispatch<React.SetStateAction<string[]>>
 * }} props
 * @returns {JSX.Element}
 */
export const Prompts: React.FC<{
  selectedPrompts: string[]
  setSelectedPrompts: React.Dispatch<React.SetStateAction<string[]>>
}> = ({
  selectedPrompts,
  setSelectedPrompts
}) => {
  return (
    <div className="form-group">
      <label>Prompts</label>
      <div className="checkbox-group">
        {PROMPT_CHOICES.map((prompt) => (
          <div key={prompt.value}>
            <input
              type="checkbox"
              id={`prompt-${prompt.value}`}
              value={prompt.value}
              checked={selectedPrompts.includes(prompt.value)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedPrompts([...selectedPrompts, prompt.value])
                } else {
                  setSelectedPrompts(selectedPrompts.filter((p) => p !== prompt.value))
                }
              }}
            />
            <label htmlFor={`prompt-${prompt.value}`}>{prompt.name}</label>
          </div>
        ))}
      </div>
    </div>
  )
}