// web/src/components/groups/Prompts.tsx

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
  finalPath: string
  frontMatter: string
  setFinalMarkdownFile: Setter<string>
  setCurrentStep: Setter<number>
  setLlmCosts: Setter<Record<string, any>>
}) => {
  const formatContent = (text: string) => text.split('\n').map((line, _index) => (
    <>
      {line}
      <br />
    </>
  ))
  const handleStepThree = async () => {
    props.setIsLoading(true)
    props.setError(null)
    props.setFinalMarkdownFile('')
    try {
      const promptRes = await fetch('http://localhost:4321/api/select-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ options: { prompt: props.selectedPrompts } })
      })
      if (!promptRes.ok) throw new Error('Error generating combined prompt')
      const promptData = await promptRes.json()
      const combinedPrompt = promptData.prompt
      const saveBody = {
        frontMatter: props.frontMatter,
        transcript: props.transcriptContent,
        prompt: combinedPrompt,
        finalPath: props.finalPath
      }
      const saveRes = await fetch('http://localhost:4321/api/save-markdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveBody)
      })
      if (!saveRes.ok) throw new Error('Error saving final markdown')
      const saveData = await saveRes.json()
      props.setFinalMarkdownFile(saveData.markdownFilePath)
      const costBody = { type: 'llmCost', filePath: saveData.markdownFilePath }
      const costRes = await fetch('http://localhost:4321/api/cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(costBody)
      })
      if (!costRes.ok) throw new Error('Failed to get LLM cost')
      const costData = await costRes.json()
      props.setLlmCosts(costData.llmCost)
      props.setCurrentStep(4)
    } catch (err) {
      if (err instanceof Error) props.setError(err.message)
      else props.setError('An unknown error occurred.')
    } finally {
      props.setIsLoading(false)
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
                    if (e.target.checked) {
                      props.setSelectedPrompts([...props.selectedPrompts, prompt.value])
                    } else {
                      props.setSelectedPrompts(props.selectedPrompts.filter(p => p !== prompt.value))
                    }
                  }}
                />
                <label for={`prompt-${prompt.value}`}>{prompt.name}</label>
              </div>
            )}
          </For>
        </div>
      </div>
      <button disabled={props.isLoading} onClick={handleStepThree}>
        {props.isLoading ? 'Saving & Estimating LLM...' : 'Save & Calculate LLM Cost'}
      </button>
    </>
  )
}
