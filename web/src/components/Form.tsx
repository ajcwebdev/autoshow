// web/src/components/Form.tsx

import React, { useState } from 'react'
import { ProcessType } from '@/components/groups/ProcessType'
import { TranscriptionService } from '@/components/groups/TranscriptionService'
import { LLMService } from '@/components/groups/LLMService'
import { Prompts } from '@/components/groups/Prompts'
import { Wallet } from '@/components/groups/Wallet'
import type {
  AlertProps, ResultType, FormProps, ProcessTypeEnum, LLMServiceKey
} from "../../../shared/types.ts"

const Alert: React.FC<AlertProps> = ({ message, variant }) => (
  <div className={`alert ${variant}`}>
    <p>{message}</p>
  </div>
)

const Form: React.FC<FormProps> = ({ onNewShowNote }) => {
  const [processType, setProcessType] = useState<ProcessTypeEnum>('file')
  const [url, setUrl] = useState('https://www.youtube.com/watch?v=MORMZXEaONk')
  const [filePath, setFilePath] = useState('content/examples/audio.mp3')
  const [transcriptionService, setTranscriptionService] = useState('')
  const [transcriptionModel, setTranscriptionModel] = useState('')
  const [llmService, setLlmService] = useState<LLMServiceKey>('skip')
  const [llmModel, setLlmModel] = useState('')
  const [selectedPrompts, setSelectedPrompts] = useState(['shortSummary'])
  const [result, setResult] = useState<ResultType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [walletAddress, setWalletAddress] = useState('yhGfbjKDuTnJyx8wzje7n9wsoWC51WH7Y5')
  const [mnemonic, setMnemonic] = useState('tip punch promote click scheme guitar skirt lucky hamster clip denial ecology')
  const [transcriptionApiKey, setTranscriptionApiKey] = useState('')
  const [llmApiKey, setLlmApiKey] = useState('')
  const [selectedLlmApiKeyService, setSelectedLlmApiKeyService] = useState('chatgpt')
  const [currentStep, setCurrentStep] = useState(0)
  const [transcriptContent, setTranscriptContent] = useState('')
  const [transcriptionCosts, setTranscriptionCosts] = useState<any>({})
  const [llmCosts, setLlmCosts] = useState<any>({})
  const [finalPath, setFinalPath] = useState('')
  const [frontMatter, setFrontMatter] = useState('')
  const [finalMarkdownFile, setFinalMarkdownFile] = useState('')
  const [metadata, setMetadata] = useState<any>({})
  const [transcriptionModelUsed, setTranscriptionModelUsed] = useState('')
  const [transcriptionCostUsed, setTranscriptionCostUsed] = useState<number | null>(null)
  const [dashBalance, setDashBalance] = useState<number | null>(null)

  const formatContent = (text: string) => text.split('\n').map((line, index) => (
    <React.Fragment key={index}>
      {line}
      <br />
    </React.Fragment>
  ))

  const handleCheckBalance = async () => {
    setIsLoading(true)
    setError(null)
    try {
      if (!walletAddress || !mnemonic) {
        throw new Error('Please enter wallet address and mnemonic')
      }
      const balanceRes = await fetch('http://localhost:3000/dash-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mnemonic, walletAddress })
      })
      if (!balanceRes.ok) throw new Error('Error getting balance')
      const data = await balanceRes.json()
      setDashBalance(data.balance)
      setCurrentStep(1)
    } catch (err) {
      if (err instanceof Error) setError(err.message)
      else setError('An unknown error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStepOne = async () => {
    setIsLoading(true)
    setError(null)
    setTranscriptionService('')
    setTranscriptionCosts({})
    try {
      let localFilePath = filePath
      if (processType === 'video') {
        const mdBody = { type: 'video', url }
        const mdRes = await fetch('http://localhost:3000/generate-markdown', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mdBody)
        })
        if (!mdRes.ok) throw new Error('Error generating markdown')
        const mdData = await mdRes.json()
        setFrontMatter(mdData.frontMatter || '')
        setMetadata(mdData.metadata || {})
        const dlBody = {
          input: url,
          filename: mdData.filename,
          options: { video: url }
        }
        const dlRes = await fetch('http://localhost:3000/download-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dlBody)
        })
        if (!dlRes.ok) throw new Error('Error downloading audio')
        const dlData = await dlRes.json()
        localFilePath = dlData.outputPath
        setFinalPath(mdData.finalPath || '')
      } else {
        const mdBody = { type: 'file', filePath }
        const mdRes = await fetch('http://localhost:3000/generate-markdown', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mdBody)
        })
        if (!mdRes.ok) throw new Error('Error generating markdown')
        const mdData = await mdRes.json()
        setFrontMatter(mdData.frontMatter || '')
        setMetadata(mdData.metadata || {})
        setFinalPath(mdData.finalPath || '')
        const dlBody = {
          input: filePath,
          filename: mdData.filename,
          options: { file: filePath }
        }
        const dlRes = await fetch('http://localhost:3000/download-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dlBody)
        })
        if (!dlRes.ok) throw new Error('Error downloading audio')
      }
      const costBody = { type: 'transcriptCost', filePath: localFilePath }
      const response = await fetch('http://localhost:3000/api/cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(costBody)
      })
      if (!response.ok) throw new Error('Failed to get transcription cost')
      const data = await response.json()
      setTranscriptionCosts(data.transcriptCost)
      setCurrentStep(2)
    } catch (err) {
      if (err instanceof Error) setError(err.message)
      else setError('An unknown error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStepTwo = async () => {
    setIsLoading(true)
    setError(null)
    setTranscriptContent('')
    try {
      const rtBody: any = {
        finalPath,
        transcriptServices: transcriptionService,
        options: {}
      }
      rtBody.options[transcriptionService] = transcriptionModel
      if (transcriptionService === 'assembly') rtBody.options.assemblyApiKey = transcriptionApiKey
      if (transcriptionService === 'deepgram') rtBody.options.deepgramApiKey = transcriptionApiKey
      const rtRes = await fetch('http://localhost:3000/run-transcription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rtBody)
      })
      if (!rtRes.ok) throw new Error('Error running transcription')
      const rtData = await rtRes.json()
      setTranscriptContent(rtData.transcript || '')
      if (rtData.modelId) setTranscriptionModelUsed(rtData.modelId)
      if (rtData.transcriptionCost != null) setTranscriptionCostUsed(rtData.transcriptionCost)
      setCurrentStep(3)
    } catch (err) {
      if (err instanceof Error) setError(err.message)
      else setError('An unknown error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStepThree = async () => {
    setIsLoading(true)
    setError(null)
    setLlmCosts({})
    setFinalMarkdownFile('')
    try {
      const promptText = selectedPrompts.join('\n')
      const saveBody = {
        frontMatter,
        transcript: transcriptContent,
        prompt: promptText,
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
      const costData = await costRes.json()
      setLlmCosts(costData.llmCost)
      setCurrentStep(4)
    } catch (err) {
      if (err instanceof Error) setError(err.message)
      else setError('An unknown error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectLLM = async () => {
    setIsLoading(true)
    setError(null)
    setResult(null)
    try {
      const runLLMBody: any = {
        filePath: finalMarkdownFile,
        llmServices: llmService,
        options: {}
      }
      if (llmService === 'chatgpt') runLLMBody.options.openaiApiKey = llmApiKey
      if (llmService === 'claude') runLLMBody.options.anthropicApiKey = llmApiKey
      if (llmService === 'gemini') runLLMBody.options.geminiApiKey = llmApiKey
      if (llmService === 'deepseek') runLLMBody.options.deepseekApiKey = llmApiKey
      if (llmService === 'together') runLLMBody.options.togetherApiKey = llmApiKey
      if (llmService === 'fireworks') runLLMBody.options.fireworksApiKey = llmApiKey
      runLLMBody.options[llmService] = llmModel
      runLLMBody.options.transcriptionServices = transcriptionService
      runLLMBody.options.transcriptionModel = transcriptionModelUsed
      runLLMBody.options.transcriptionCost = transcriptionCostUsed
      runLLMBody.options.metadata = metadata
      const runLLMRes = await fetch('http://localhost:3000/run-llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(runLLMBody)
      })
      if (!runLLMRes.ok) throw new Error('Error running LLM')
      const data = await runLLMRes.json()
      setResult({
        llmOutput: data.showNotesResult || '',
        frontMatter: data.showNote?.frontmatter || '',
        prompt: data.showNote?.prompt || '',
        transcript: data.showNote?.transcript || ''
      })
      onNewShowNote()
    } catch (err) {
      if (err instanceof Error) setError(err.message)
      else setError('An unknown error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {currentStep === 0 && (
        <div>
          <Wallet
            walletAddress={walletAddress}
            setWalletAddress={setWalletAddress}
            mnemonic={mnemonic}
            setMnemonic={setMnemonic}
          />
          <button disabled={isLoading} onClick={handleCheckBalance}>
            {isLoading ? 'Checking...' : 'Check Balance'}
          </button>
          {dashBalance !== null && (
            <p>Balance: {dashBalance}</p>
          )}
        </div>
      )}
      {currentStep === 1 && (
        <div>
          <ProcessType
            processType={processType}
            setProcessType={setProcessType}
            url={url}
            setUrl={setUrl}
            filePath={filePath}
            setFilePath={setFilePath}
          />
          <button disabled={isLoading} onClick={handleStepOne}>
            {isLoading ? 'Calculating...' : 'Calculate Transcription Cost'}
          </button>
        </div>
      )}
      {currentStep === 2 && (
        <div>
          <h3>Select a Transcription Service</h3>
          {!Object.keys(transcriptionCosts).length && <p>No cost data available</p>}
          {Object.entries(transcriptionCosts).map(([svc, models]) => (
            <div key={svc}>
              <h4>{svc}</h4>
              {(models as any[]).map(m => (
                <div key={m.modelId}>
                  <input
                    type="radio"
                    name="transcriptionChoice"
                    value={`${svc}:${m.modelId}`}
                    checked={transcriptionService === svc && transcriptionModel === m.modelId}
                    onChange={() => {
                      setTranscriptionService(svc)
                      setTranscriptionModel(m.modelId)
                    }}
                  />
                  <label>{m.modelId} - Cost: {m.cost} cents ({Math.round(m.cost * 50000000)} credits)</label>
                </div>
              ))}
            </div>
          ))}
          <TranscriptionService
            transcriptionApiKey={transcriptionApiKey}
            setTranscriptionApiKey={setTranscriptionApiKey}
          />
          <button disabled={isLoading} onClick={handleStepTwo}>
            {isLoading ? 'Transcribing...' : 'Generate Transcription'}
          </button>
        </div>
      )}
      {currentStep === 3 && (
        <div>
          <h3>Transcript</h3>
          <div style={{ border: '1px solid #ccc', padding: '10px', maxHeight: '200px', overflow: 'auto' }}>
            {transcriptContent ? formatContent(transcriptContent) : 'No transcript content yet'}
          </div>
          <Prompts
            selectedPrompts={selectedPrompts}
            setSelectedPrompts={setSelectedPrompts}
          />
          <button disabled={isLoading} onClick={handleStepThree}>
            {isLoading ? 'Saving & Estimating LLM...' : 'Save & Calculate LLM Cost'}
          </button>
        </div>
      )}
      {currentStep === 4 && (
        <div>
          <h3>Select an LLM Service</h3>
          {!Object.keys(llmCosts).length && <p>No LLM cost data available</p>}
          {Object.entries(llmCosts).map(([svc, models]) => (
            <div key={svc}>
              <h4>{svc}</h4>
              {(models as any[]).map(m => (
                <div key={m.modelId}>
                  <input
                    type="radio"
                    name="llmChoice"
                    value={`${svc}:${m.modelId}`}
                    checked={llmService === svc && llmModel === m.modelId}
                    onChange={() => {
                      setLlmService(svc as LLMServiceKey)
                      setLlmModel(m.modelId)
                    }}
                  />
                  <label>{m.modelId} - Cost: {m.cost} cents ({Math.round(m.cost * 50000000)} credits)</label>
                </div>
              ))}
            </div>
          ))}
          <LLMService
            llmService={llmService}
            setLlmService={setLlmService}
            llmModel={llmModel}
            setLlmModel={setLlmModel}
            llmApiKey={llmApiKey}
            setLlmApiKey={setLlmApiKey}
            selectedLlmApiKeyService={selectedLlmApiKeyService}
            setSelectedLlmApiKeyService={setSelectedLlmApiKeyService}
          />
          <button disabled={isLoading} onClick={handleSelectLLM}>
            {isLoading ? 'Generating Show Notes...' : 'Generate Show Notes'}
          </button>
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