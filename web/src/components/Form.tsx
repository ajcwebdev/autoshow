// web/src/components/Form.tsx

import React, { useState } from 'react'
import { ProcessType } from '@/components/groups/ProcessType'
import { TranscriptionService } from '@/components/groups/TranscriptionService'
import { LLMService } from '@/components/groups/LLMService'
import { Prompts } from '@/components/groups/Prompts'

import type {
  AlertProps, ResultType, FormProps, ProcessTypeEnum
} from "@/types"

import { TRANSCRIPTION_SERVICES_CONFIG, LLM_SERVICES_CONFIG } from '../../../shared/constants'

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
  const [selectedTranscriptionApiKeyService, setSelectedTranscriptionApiKeyService] = useState<string>('')

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

  /**
   * Tracks the current step of the multi-step process.
   */
  const [currentStep, setCurrentStep] = useState<number>(1)

  /**
   * Stores the cost estimates for each transcription service in step 1.
   */
  const [transcriptionCosts, setTranscriptionCosts] = useState<Array<{ service: string, cost: any }>>([])

  /**
   * Stores the cost estimates for each LLM service in step 3.
   */
  const [llmCosts, setLlmCosts] = useState<Array<{ service: string, cost: any }>>([])

  /**
   * After picking a transcription service, hold the final transcript content here.
   */
  const [transcriptContent, setTranscriptContent] = useState<string>('')

  /**
   * Step 1: Calculate cost for each transcription service (video or file)
   */
  const handleCalculateTranscriptCost = async () => {
    setIsLoading(true)
    setError(null)
    setTranscriptionCosts([])

    try {
      // We'll do one cost call for each known transcription service
      const costs: Array<{ service: string, cost: any }> = []
      for (const svc of Object.values(TRANSCRIPTION_SERVICES_CONFIG)) {
        if (!svc.value) continue

        const body: Record<string, unknown> = {
          type: 'transcriptCost',
          filePath: filePath,
          transcriptServices: svc.value
        }

        // If we're in video mode, this code won't physically parse the video on the server,
        // but shows how you'd request cost (if your backend supports it).
        // For the existing code, transcriptCost expects a filePath, so we do a best-effort approach.
        if (processType === 'video') {
          // The server's transcriptCost path doesn't truly handle videos in the sample, but we place a placeholder.
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
   * Step 2: After user chooses a transcription service, run the actual transcription
   * (either "video" or "file") and store the transcript. Then also allow selecting prompts.
   *
   * @param chosenService - The transcription service the user selected from the cost list
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

      // For whisper model
      if (chosenService.startsWith('whisper')) {
        requestBody.whisperModel = whisperModel
      }

      // Map transcription API key
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
   * Step 3: Combine transcript + selected prompts into a single file or string, then
   * calculate LLM cost for each LLM service.
   */
  const handleCalculateLLMCosts = async () => {
    setIsLoading(true)
    setError(null)
    setLlmCosts([])

    try {
      // We assume the combined text is just transcript + prompt placeholders
      const combinedText = transcriptContent + '\n\nPrompts:\n' + selectedPrompts.join(', ')

      // Write or send combined text to the server in a "filePath" field
      // (In a real app, you'd have an endpoint or logic to store the combined text in a file.)
      // For demonstration, we'll just pass it as "filePath" memory.
      // The server's llmCost logic expects filePath, so we do a best-effort approach here.
      const combinedFilePath = 'combined-transcript-and-prompts.txt'

      const costs: Array<{ service: string, cost: any }> = []
      for (const svc of Object.values(LLM_SERVICES_CONFIG)) {
        if (!svc.value) continue

        const body: Record<string, unknown> = {
          type: 'llmCost',
          filePath: combinedFilePath,
          llm: svc.value,
          walletAddress,
          mnemonic,
        }

        // Provide an example of how you'd pass an LLM API key
        if (selectedLlmApiKeyService === 'chatgpt' && svc.value === 'chatgpt') {
          body.openaiApiKey = llmApiKey
        } else if (selectedLlmApiKeyService === 'claude' && svc.value === 'claude') {
          body.anthropicApiKey = llmApiKey
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
   * Final Step: Run the chosen LLM. We pass the combined transcript+prompts to the server
   * using "runLLM" type, and then display the final result.
   *
   * @param chosenLlm - The LLM service the user selected
   */
  const handleRunLLM = async (chosenLlm: string) => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      // We'll re-send the combined text as a "filePath" again
      const combinedFilePath = 'combined-transcript-and-prompts.txt'

      const requestBody: any = {
        type: 'runLLM',
        filePath: combinedFilePath,
        llm: chosenLlm,
        walletAddress,
        mnemonic,
      }

      // Map LLM API key
      if (selectedLlmApiKeyService === 'chatgpt' && chosenLlm === 'chatgpt') {
        requestBody.openaiApiKey = llmApiKey
      } else if (selectedLlmApiKeyService === 'claude' && chosenLlm === 'claude') {
        requestBody.anthropicApiKey = llmApiKey
      } else if (selectedLlmApiKeyService === 'gemini' && chosenLlm === 'gemini') {
        requestBody.geminiApiKey = llmApiKey
      } else if (selectedLlmApiKeyService === 'deepseek' && chosenLlm === 'deepseek') {
        requestBody.deepseekApiKey = llmApiKey
      } else if (selectedLlmApiKeyService === 'together' && chosenLlm === 'together') {
        requestBody.togetherApiKey = llmApiKey
      } else if (selectedLlmApiKeyService === 'fireworks' && chosenLlm === 'fireworks') {
        requestBody.fireworksApiKey = llmApiKey
      }

      const response = await fetch('http://localhost:3000/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // The 'runLLM' path in the example returns only { message }, but if you adapt your backend,
      // you can return an updated "ResultType". We'll just mock it as if it returned an LLM output:
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
      {/* 
        Step 1: Input for process type, URL/file path, and button to calculate transcription cost 
      */}
      {currentStep === 1 && (
        <div>
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

      {/* 
        Step 2: Display transcription costs, pick a service, run actual transcription, and choose prompts 
      */}
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

      {/* 
        Step 3: Calculate LLM cost using the transcript+prompts, show LLM options, and run final LLM 
      */}
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

          {/* 
            Show existing LLMService UI for setting model & API keys if needed 
          */}
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