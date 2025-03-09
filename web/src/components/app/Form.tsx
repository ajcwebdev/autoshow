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
  const [filePath, setFilePath] = useState<string>('content/examples/audio.mp3')
  const [transcriptionService, setTranscriptionService] = useState<string>('whisper')
  const [whisperModel, setWhisperModel] = useState<string>('tiny')
  const [llmService, setLlmService] = useState<string>('none')
  const [llmModel, setLlmModel] = useState<string>('')
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>(['shortSummary'])
  const [result, setResult] = useState<ResultType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  /**
   * Stores the user's wallet address.
   * @type {[string, React.Dispatch<React.SetStateAction<string>>]}
   */
  const [walletAddress, setWalletAddress] = useState<string>('')

  /**
   * Stores the user's mnemonic for the wallet.
   * @type {[string, React.Dispatch<React.SetStateAction<string>>]}
   */
  const [mnemonic, setMnemonic] = useState<string>('')

  /**
   * Stores the user's transcription API key.
   * @type {[string, React.Dispatch<React.SetStateAction<string>>]}
   */
  const [transcriptionApiKey, setTranscriptionApiKey] = useState<string>('')

  /**
   * Stores the selected transcription API key service.
   * @type {[string, React.Dispatch<React.SetStateAction<string>>]}
   */
  const [selectedTranscriptionApiKeyService, setSelectedTranscriptionApiKeyService] = useState<string>('assembly')

  /**
   * Stores the user's LLM API key.
   * @type {[string, React.Dispatch<React.SetStateAction<string>>]}
   */
  const [llmApiKey, setLlmApiKey] = useState<string>('')

  /**
   * Stores the selected LLM API key service.
   * @type {[string, React.Dispatch<React.SetStateAction<string>>]}
   */
  const [selectedLlmApiKeyService, setSelectedLlmApiKeyService] = useState<string>('chatgpt')

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

      // Include walletAddress and mnemonic in the request body
      requestBody.walletAddress = walletAddress
      requestBody.mnemonic = mnemonic

      // Map transcription API key to the correct field
      if (selectedTranscriptionApiKeyService === 'assembly') {
        requestBody.assemblyApiKey = transcriptionApiKey
      } else if (selectedTranscriptionApiKeyService === 'deepgram') {
        requestBody.deepgramApiKey = transcriptionApiKey
      }

      // Map LLM API key to the correct field
      if (selectedLlmApiKeyService === 'chatgpt') {
        requestBody.openaiApiKey = llmApiKey
      } else if (selectedLlmApiKeyService === 'claude') {
        requestBody.anthropicApiKey = llmApiKey
      } else if (selectedLlmApiKeyService === 'gemini') {
        requestBody.geminiApiKey = llmApiKey
      } else if (selectedLlmApiKeyService === 'deepseek') {
        requestBody.deepseekApiKey = llmApiKey
      } else if (selectedLlmApiKeyService === 'together') {
        requestBody.togetherApiKey = llmApiKey
      } else if (selectedLlmApiKeyService === 'fireworks') {
        requestBody.fireworksApiKey = llmApiKey
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

        <label htmlFor="walletAddress">Wallet Address</label>
        <input
          type="text"
          id="walletAddress"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
        />

        <label htmlFor="mnemonic">Mnemonic</label>
        <input
          type="text"
          id="mnemonic"
          value={mnemonic}
          onChange={(e) => setMnemonic(e.target.value)}
        />

        <label htmlFor="transcriptionApiKeyService">Transcription API Key Service</label>
        <select
          id="transcriptionApiKeyService"
          value={selectedTranscriptionApiKeyService}
          onChange={(e) => setSelectedTranscriptionApiKeyService(e.target.value)}
        >
          <option value="assembly">Assembly</option>
          <option value="deepgram">Deepgram</option>
        </select>

        <label htmlFor="transcriptionApiKey">Transcription API Key</label>
        <input
          type="text"
          id="transcriptionApiKey"
          value={transcriptionApiKey}
          onChange={(e) => setTranscriptionApiKey(e.target.value)}
        />

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

        <label htmlFor="llmApiKey">LLM API Key</label>
        <input
          type="text"
          id="llmApiKey"
          value={llmApiKey}
          onChange={(e) => setLlmApiKey(e.target.value)}
        />

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
          // @ts-ignore
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