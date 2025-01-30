// web/src/components/app/Form.tsx

import '../../styles/global.css'
import React, { useState } from 'react'
import {
  PROMPT_CHOICES, TRANSCRIPTION_SERVICES, WHISPER_MODELS, LLM_SERVICES, LLM_MODELS, PROCESS_TYPES
} from '@/site-config'
import type {
  AlertProps, LlmServiceKey, ResultType, FormProps, ProcessType
} from '../../types.ts'

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
  const [processType, setProcessType] = useState<ProcessType>('video')
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

      const response = await fetch('http://localhost:3000/process', {
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
        <div className="form-group">
          <label htmlFor="processType">Process Type</label>
          <select
            id="processType"
            value={processType}
            onChange={(e) => setProcessType(e.target.value as ProcessType)}
          >
            {PROCESS_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {(processType === 'video') && (
          <div className="form-group">
            <label htmlFor="url">
              {processType === 'video'}
              YouTube URL
            </label>
            <input
              type="text"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>
        )}

        {(processType === 'file') && (
          <div className="form-group">
            <label htmlFor="filePath">File Path</label>
            <input
              type="text"
              id="filePath"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              required
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="transcriptionService">Transcription Service</label>
          <select
            id="transcriptionService"
            value={transcriptionService}
            onChange={(e) => setTranscriptionService(e.target.value)}
          >
            {TRANSCRIPTION_SERVICES.map((service) => (
              <option key={service.value} value={service.value}>
                {service.label}
              </option>
            ))}
          </select>
        </div>

        {transcriptionService.startsWith('whisper') && (
          <div className="form-group">
            <label htmlFor="whisperModel">Whisper Model</label>
            <select
              id="whisperModel"
              value={whisperModel}
              onChange={(e) => setWhisperModel(e.target.value)}
            >
              {WHISPER_MODELS.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
          </div>
        )}

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