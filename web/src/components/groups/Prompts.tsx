// web/src/components/groups/Prompts.tsx

import React from 'react'
import { PROMPT_CHOICES } from '../../../../shared/constants.ts'

export const PromptsStep: React.FC<{
  isLoading: boolean
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
  setError: React.Dispatch<React.SetStateAction<string | null>>
  transcriptContent: string
  selectedPrompts: string[]
  setSelectedPrompts: React.Dispatch<React.SetStateAction<string[]>>
  finalPath: string
  frontMatter: string
  setFinalMarkdownFile: React.Dispatch<React.SetStateAction<string>>
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>
}> = ({
  isLoading,
  setIsLoading,
  setError,
  transcriptContent,
  selectedPrompts,
  setSelectedPrompts,
  finalPath,
  frontMatter,
  setFinalMarkdownFile,
  setCurrentStep
}) => {
  const formatContent = (text: string) => text.split('\n').map((line, index) => (
    <React.Fragment key={index}>
      {line}
      <br />
    </React.Fragment>
  ))

  const handleStepThree = async () => {
    setIsLoading(true)
    setError(null)
    setFinalMarkdownFile('')
    try {
      const promptRes = await fetch('http://localhost:3000/select-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ options: { prompt: selectedPrompts } })
      })
      if (!promptRes.ok) throw new Error('Error generating combined prompt')
      const promptData = await promptRes.json()
      const combinedPrompt = promptData.prompt
      const saveBody = {
        frontMatter,
        transcript: transcriptContent,
        prompt: combinedPrompt,
        finalPath
      }
      const saveRes = await fetch('http://localhost:3000/save-markdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveBody)
      })
      if (!saveRes.ok) throw new Error('Error saving final markdown')
      const saveData = await saveRes.json()
      setFinalMarkdownFile(saveData.markdownFilePath)
      const costBody = { type: 'llmCost', filePath: saveData.markdownFilePath }
      const costRes = await fetch('http://localhost:3000/api/cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(costBody)
      })
      if (!costRes.ok) throw new Error('Failed to get LLM cost')
      await costRes.json()
      setCurrentStep(4)
    } catch (err) {
      if (err instanceof Error) setError(err.message)
      else setError('An unknown error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <h3>Transcript</h3>
      <div style={{ border: '1px solid #ccc', padding: '10px', maxHeight: '200px', overflow: 'auto' }}>
        {transcriptContent ? formatContent(transcriptContent) : 'No transcript content yet'}
      </div>
      <div className="form-group">
        <label>Prompts</label>
        <div className="checkbox-group">
          {PROMPT_CHOICES.map(prompt => (
            <div key={prompt.value}>
              <input
                type="checkbox"
                id={`prompt-${prompt.value}`}
                value={prompt.value}
                checked={selectedPrompts.includes(prompt.value)}
                onChange={e => {
                  if (e.target.checked) {
                    setSelectedPrompts([...selectedPrompts, prompt.value])
                  } else {
                    setSelectedPrompts(selectedPrompts.filter(p => p !== prompt.value))
                  }
                }}
              />
              <label htmlFor={`prompt-${prompt.value}`}>{prompt.name}</label>
            </div>
          ))}
        </div>
      </div>
      <button disabled={isLoading} onClick={handleStepThree}>
        {isLoading ? 'Saving & Estimating LLM...' : 'Save & Calculate LLM Cost'}
      </button>
    </>
  )
}