// src/components/groups/Prompts.tsx

import { For } from 'solid-js'
import type { Setter } from 'solid-js'
import { PROMPT_CHOICES } from '../../constants.ts'
export const PromptsStep = (props: {
  isLoading: boolean
  setIsLoading: Setter<boolean>
  setError: Setter<string | null>
  transcriptContent: string
  selectedPrompts: string[]
  setSelectedPrompts: Setter<string[]>
  finalPath: string // Kept for context / potential future use
  frontMatter: string // Kept for context / potential future use
  // setFinalMarkdownFile removed
  setCurrentStep: Setter<number>
}) => {
  const logPrefix = '[PromptsStep]'
  const formatContent = (text: string) => {
    console.log(`${logPrefix} Formatting content (length: ${text.length})`)
    return text.split('\n').map((line, _index) => (
      <>
        {line}
        <br />
      </>
    ))
  }
  const handleStepThree = async (): Promise<void> => {
    console.log(`${logPrefix} handleStepThree called`)
    props.setIsLoading(true)
    console.log(`${logPrefix} isLoading set to true (though no async call here)`)
    props.setError(null)
    console.log(`${logPrefix} error set to null`)
    try {
      // No API calls needed here. Just advance the step.
      console.log(`${logPrefix} Selected prompts confirmed: ${props.selectedPrompts.join(', ')}`)
      console.log(`${logPrefix} Final path context: ${props.finalPath}`)
      // finalMarkdownFile state is no longer set here
      props.setCurrentStep(4)
      console.log(`${logPrefix} Set currentStep to 4`)
    } catch (err) {
      console.error(`${logPrefix} Error in handleStepThree:`, err)
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
      <h3>Transcript</h3>
      <div style={{ border: '1px solid #ccc', padding: '10px', 'max-height': '200px', overflow: 'auto' }}>
        {props.transcriptContent ? formatContent(props.transcriptContent) : 'No transcript content yet'}
      </div>
      <br />
      <div class="form-group">
        <label>Prompts</label>
        <div class="checkbox-group">
          <For each={PROMPT_CHOICES}>
            {prompt => (
              <div>
                <input
                  type="checkbox"
                  id={`prompt-${prompt.value}`}
                  value={prompt.value}
                  checked={props.selectedPrompts.includes(prompt.value)}
                  onInput={e => {
                    const isChecked = e.target.checked
                    console.log(`<span class="math-inline">\{logPrefix\} Prompt checkbox '</span>{prompt.value}' changed: ${isChecked}`)
                    if (isChecked) {
                      props.setSelectedPrompts([...props.selectedPrompts, prompt.value])
                      console.log(`<span class="math-inline">\{logPrefix\} Added '</span>{prompt.value}' to selectedPrompts`)
                    } else {
                      props.setSelectedPrompts(props.selectedPrompts.filter(p => p !== prompt.value))
                      console.log(`<span class="math-inline">\{logPrefix\} Removed '</span>{prompt.value}' from selectedPrompts`)
                    }
                    console.log(`${logPrefix} Current selectedPrompts: ${props.selectedPrompts.join(', ')}`)
                  }}
                />
                <label for={`prompt-${prompt.value}`}>{prompt.name}</label>
              </div>
            )}
          </For>
        </div>
      </div>
      <button disabled={props.isLoading} onClick={handleStepThree}>
        {props.isLoading ? 'Processing...' : 'Confirm Prompts & Proceed'}
      </button>
    </>
  )
}