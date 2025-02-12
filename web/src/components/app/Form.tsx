// web/src/components/app/Form.tsx

import React, { useState } from 'react'
import { ProcessType } from '@/components/app/groups/ProcessType'
import { TranscriptionService } from '@/components/app/groups/TranscriptionService'
import { LLMService } from '@/components/app/groups/LLMService'
import { Prompts } from '@/components/app/groups/Prompts'

import type {
  AlertProps, ResultType, FormProps, ProcessTypeEnum
} from "@/types"

/**
 * Displays a styled alert message based on a variant type.
 *
 * @param {AlertProps} props - The properties for the alert, including a message and variant
 * @returns {JSX.Element} An alert element
 */
const Alert: React.FC<AlertProps> = ({ message, variant }) => (
  <div className={`alert ${variant}`}>
    <p>{message}</p>
  </div>
)

/**
 * The Form component handles form input fields for selecting and submitting process types,
 * transcription services, LLM services, models, and prompts. It then sends the user’s choices
 * to the backend for processing and displays the returned results.
 *
 * @param {FormProps} props - The component props, including an onNewShowNote callback
 * @returns {JSX.Element} A form rendering various input controls and submission logic
 */
const Form: React.FC<FormProps> = ({ onNewShowNote }) => {
  const [processType, setProcessType] = useState<ProcessTypeEnum>('video')
  const [url, setUrl] = useState<string>('https://www.youtube.com/watch?v=MORMZXEaONk')
  const [filePath, setFilePath] = useState<string>('content/audio.mp3')
  const [transcriptionService, setTranscriptionService] = useState<string>('whisper')
  const [whisperModel, setWhisperModel] = useState<string>('base')
  const [llmService, setLlmService] = useState<string>('ollama')
  const [llmModel, setLlmModel] = useState<string>('')
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>(['summary'])
  const [result, setResult] = useState<ResultType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setResult(null)

    if (selectedPrompts.length === 0) {
      setError('Please select at least one prompt.')
      setIsLoading(false)
      return
    }

    try {
      const requestBody: any = {
        type: processType,
        transcriptServices: transcriptionService,
        llm: llmService,
        prompt: selectedPrompts,
      }

      if (processType === 'video') {
        requestBody.url = url
      } else if (processType === 'file') {
        requestBody.filePath = filePath
      }

      // Add optional fields
      if (transcriptionService.startsWith('whisper')) {
        requestBody.whisperModel = whisperModel
      }
      if (llmService) {
        requestBody.llmModel = llmModel
      }

      const response = await fetch('http://localhost:3000/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = (await response.json()) as ResultType
      setResult(data)

      onNewShowNote()
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unknown error occurred.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const formatContent = (text: string) => {
    return text.split('\n').map((line: string, index: number) => (
      <React.Fragment key={index}>
        {line}
        <br />
      </React.Fragment>
    ))
  }

  return (
    <>
      <form onSubmit={handleSubmit}>

        <ProcessType
          processType={processType}
          setProcessType={setProcessType}
          url={url}
          setUrl={setUrl}
          filePath={filePath}
          setFilePath={setFilePath}
        />

        <TranscriptionService
          transcriptionService={transcriptionService}
          setTranscriptionService={setTranscriptionService}
          whisperModel={whisperModel}
          setWhisperModel={setWhisperModel}
        />

        <LLMService
          llmService={llmService}
          setLlmService={setLlmService}
          llmModel={llmModel}
          setLlmModel={setLlmModel}
        />

        <Prompts
          selectedPrompts={selectedPrompts}
          setSelectedPrompts={setSelectedPrompts}
        />

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Submit'}
        </button>
      </form>

      {error && <Alert message={error} variant="error" />}

      {result && (
        <div className="result">
          {result.llmOutput && (
            <>
              <h3>LLM Output</h3>
              <div>{formatContent(result.llmOutput)}</div>
            </>
          )}
          {result.frontMatter && (
            <>
              <h3>Front Matter</h3>
              <div>{formatContent(result.frontMatter)}</div>
            </>
          )}
          {result.prompt && (
            <>
              <h3>Prompt</h3>
              <div>{formatContent(result.prompt)}</div>
            </>
          )}
          {result.transcript && (
            <>
              <h3>Transcript</h3>
              <div>{formatContent(result.transcript)}</div>
            </>
          )}
        </div>
      )}
    </>
  )
}

export default Form