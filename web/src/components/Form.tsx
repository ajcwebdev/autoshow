// web/src/components/Form.tsx

import React, { useState } from 'react'
import { ProcessType } from '@/components/groups/ProcessType'
import { TranscriptionService } from '@/components/groups/TranscriptionService'
import { LLMService } from '@/components/groups/LLMService'
import { Prompts } from '@/components/groups/Prompts'
import { Wallet } from '@/components/groups/Wallet'

import type {
  AlertProps, ResultType, FormProps, ProcessTypeEnum
} from "@/types"

import { T_CONFIG, L_CONFIG } from '../../../shared/constants.ts'

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
 * The Form component is now a multi-step process that:
 * 1) Asks for video/file input and calculates transcription cost.
 * 2) Lets the user pick a transcription service, transcribes, and select prompts.
 * 3) Calculates LLM cost based on the transcript+prompt and lets the user pick an LLM to run.
 *
 * @param {FormProps} props - The component props, including an onNewShowNote callback
 * @returns {JSX.Element} A multi-step form rendering various controls and submission logic
 */
const Form: React.FC<FormProps> = ({ onNewShowNote }) => {
  const [processType, setProcessType] = useState<ProcessTypeEnum>('file')
  const [url, setUrl] = useState<string>('https://www.youtube.com/watch?v=MORMZXEaONk')
  const [filePath, setFilePath] = useState<string>('content/examples/audio.mp3')
  const [transcriptionService, setTranscriptionService] = useState<string>('whisper')
  const [whisperModel, setWhisperModel] = useState<string>('tiny')
  const [llmService, setLlmService] = useState<string>('chatgpt')
  const [llmModel, setLlmModel] = useState<string>('')
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>(['shortSummary'])
  const [result, setResult] = useState<ResultType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const [walletAddress, setWalletAddress] = useState<string>('')
  const [mnemonic, setMnemonic] = useState<string>('')

  const [transcriptionApiKey, setTranscriptionApiKey] = useState<string>('')
  const [selectedTranscriptionApiKeyService, setSelectedTranscriptionApiKeyService] = useState<string>('')

  const [llmApiKey, setLlmApiKey] = useState<string>('')
  const [selectedLlmApiKeyService, setSelectedLlmApiKeyService] = useState<string>('chatgpt')

  const [currentStep, setCurrentStep] = useState<number>(1)
  const [transcriptionCosts, setTranscriptionCosts] = useState<Array<{ service: string, cost: any }>>([])
  const [llmCosts, setLlmCosts] = useState<Array<{ service: string, cost: any }>>([])
  const [transcriptContent, setTranscriptContent] = useState<string>('')

  /**
   * This function is triggered in Step 1 to get cost estimates from each transcription provider.
   */
  const handleCalculateTranscriptCost = async () => {
    setIsLoading(true)
    setError(null)
    setTranscriptionCosts([])

    try {
      const costs: Array<{ service: string, cost: any }> = []
      for (const svc of Object.values(T_CONFIG)) {
        if (!svc.value) continue

        const body: Record<string, unknown> = {
          type: 'transcriptCost',
          filePath: filePath,
          transcriptServices: svc.value
        }

        if (processType === 'video') {
          body.filePath = url
        }

        const response = await fetch('http://localhost:3000/api/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch transcription cost for ${svc.value}`)
        }

        const data = await response.json()
        costs.push({ service: svc.value, cost: data.cost })
      }
      setTranscriptionCosts(costs)
      setCurrentStep(2)
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

  /**
   * This function is used in Step 2 to actually run transcription with the chosen service.
   */
  const handleRunTranscription = async (chosenService: string) => {
    setIsLoading(true)
    setError(null)
    setTranscriptContent('')

    try {
      const requestBody: any = {
        type: processType,
        transcriptServices: chosenService,
        walletAddress,
        mnemonic,
      }

      if (processType === 'video') {
        requestBody.url = url
      } else if (processType === 'file') {
        requestBody.filePath = filePath
      }

      if (chosenService.startsWith('whisper')) {
        requestBody.whisperModel = whisperModel
      }

      if (selectedTranscriptionApiKeyService === 'assembly') {
        requestBody.assemblyApiKey = transcriptionApiKey
      } else if (selectedTranscriptionApiKeyService === 'deepgram') {
        requestBody.deepgramApiKey = transcriptionApiKey
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
      setTranscriptContent(data.transcript || '')
      setResult(null)
      setCurrentStep(3)
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

  /**
   * In Step 3, we combine transcript + prompts and calculate LLM cost from each provider.
   */
  const handleCalculateLLMCosts = async () => {
    setIsLoading(true)
    setError(null)
    setLlmCosts([])

    try {
      const combinedFilePath = 'combined-transcript-and-prompts.txt'
      const costs: Array<{ service: string, cost: any }> = []

      for (const svc of Object.values(L_CONFIG)) {
        if (!svc.value) continue

        const body: Record<string, unknown> = {
          type: 'llmCost',
          filePath: combinedFilePath,
          llm: svc.value,
          walletAddress,
          mnemonic,
        }

        // Cast svc.value to the LLM service's key type
        const svcKey = svc.value as keyof typeof L_CONFIG
        if (
          selectedLlmApiKeyService === svc.value &&
          'apiKeyPropName' in L_CONFIG[svcKey]
        ) {
          const serviceConfig = L_CONFIG[svcKey as keyof typeof L_CONFIG];
          if ('apiKeyPropName' in serviceConfig) {
            body[serviceConfig.apiKeyPropName] = llmApiKey;
          }
        }

        const response = await fetch('http://localhost:3000/api/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch LLM cost for ${svc.value}`)
        }

        const data = await response.json()
        costs.push({ service: svc.value, cost: data.cost })
      }
      setLlmCosts(costs)
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

  /**
   * Final Step: Run the chosen LLM with combined transcript and prompts, then display results.
   */
  const handleRunLLM = async (chosenLlm: string) => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const combinedFilePath = 'combined-transcript-and-prompts.txt'
      const requestBody: any = {
        type: 'runLLM',
        filePath: combinedFilePath,
        llm: chosenLlm,
        walletAddress,
        mnemonic,
      }

      const chosenKey = chosenLlm as keyof typeof L_CONFIG
      if (selectedLlmApiKeyService === chosenLlm && 
          'apiKeyPropName' in L_CONFIG[chosenKey]) {
        const serviceConfig = L_CONFIG[chosenKey];
        if ('apiKeyPropName' in serviceConfig && typeof serviceConfig.apiKeyPropName === 'string') {
          requestBody[serviceConfig.apiKeyPropName] = llmApiKey;
        }
      }

      const response = await fetch('http://localhost:3000/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setResult({
        llmOutput: data.message || 'LLM processing complete',
        frontMatter: '',
        prompt: '',
        transcript: ''
      })

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
      {currentStep === 1 && (
        <div>
          <Wallet
            walletAddress={walletAddress}
            setWalletAddress={setWalletAddress}
            mnemonic={mnemonic}
            setMnemonic={setMnemonic}
          />

          <ProcessType
            processType={processType}
            setProcessType={setProcessType}
            url={url}
            setUrl={setUrl}
            filePath={filePath}
            setFilePath={setFilePath}
          />

          <button
            disabled={isLoading}
            onClick={handleCalculateTranscriptCost}
          >
            {isLoading ? 'Calculating...' : 'Calculate Transcription Cost'}
          </button>
        </div>
      )}

      {currentStep === 2 && (
        <div>
          <h3>Select a Transcription Service (Cost Estimates)</h3>
          {transcriptionCosts.length === 0 && (
            <p>No cost data available</p>
          )}
          {transcriptionCosts.map((item) => (
            <div key={item.service}>
              <input
                type="radio"
                name="transcriptionChoice"
                value={item.service}
                checked={transcriptionService === item.service}
                onChange={() => setTranscriptionService(item.service)}
              />
              <label>{item.service} - Cost: {item.cost}</label>
            </div>
          ))}

          <TranscriptionService
            transcriptionService={transcriptionService}
            setTranscriptionService={setTranscriptionService}
            whisperModel={whisperModel}
            setWhisperModel={setWhisperModel}
            transcriptionApiKey={transcriptionApiKey}
            setTranscriptionApiKey={setTranscriptionApiKey}
            selectedTranscriptionApiKeyService={selectedTranscriptionApiKeyService}
            setSelectedTranscriptionApiKeyService={setSelectedTranscriptionApiKeyService}
          />

          <button
            disabled={isLoading}
            onClick={() => handleRunTranscription(transcriptionService)}
          >
            {isLoading ? 'Transcribing...' : 'Transcribe'}
          </button>

          <hr />

          <Prompts
            selectedPrompts={selectedPrompts}
            setSelectedPrompts={setSelectedPrompts}
          />
        </div>
      )}

      {currentStep === 3 && (
        <div>
          <h3>Transcript Ready</h3>
          <div style={{ border: '1px solid #ccc', padding: '10px', maxHeight: '200px', overflow: 'auto' }}>
            {transcriptContent ? formatContent(transcriptContent) : 'No transcript content yet'}
          </div>

          <br />
          <button
            disabled={isLoading}
            onClick={handleCalculateLLMCosts}
          >
            {isLoading ? 'Estimating LLM Costs...' : 'Calculate LLM Costs'}
          </button>

          {llmCosts.length > 0 && (
            <div>
              <h3>LLM Cost Estimates</h3>
              {llmCosts.map((item) => (
                <div key={item.service}>
                  <input
                    type="radio"
                    name="llmChoice"
                    value={item.service}
                    checked={llmService === item.service}
                    onChange={() => setLlmService(item.service)}
                  />
                  <label>{item.service} - Cost: {item.cost}</label>
                </div>
              ))}
            </div>
          )}

          {llmCosts.length > 0 && (
            <LLMService
              // @ts-ignore
              llmService={llmService}
              setLlmService={setLlmService}
              llmModel={llmModel}
              setLlmModel={setLlmModel}
              llmApiKey={llmApiKey}
              setLlmApiKey={setLlmApiKey}
              selectedLlmApiKeyService={selectedLlmApiKeyService}
              setSelectedLlmApiKeyService={setSelectedLlmApiKeyService}
            />
          )}

          {llmCosts.length > 0 && (
            <button
              disabled={isLoading}
              onClick={() => handleRunLLM(llmService)}
            >
              {isLoading ? 'Running LLM...' : 'Run LLM'}
            </button>
          )}
        </div>
      )}

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