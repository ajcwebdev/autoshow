// web/src/components/Form.tsx

import React, { useState } from 'react'
import { WalletStep } from '@/components/groups/Wallet'
import { ProcessTypeStep } from '@/components/groups/ProcessType'
import { TranscriptionStep } from '@/components/groups/TranscriptionService'
import { PromptsStep } from '@/components/groups/Prompts'
import { LLMServiceStep } from '@/components/groups/LLMService'
import '@/styles'
import type { AlertProps, ResultType, FormProps, ProcessTypeEnum, LLMServiceKey } from "../../../shared/types.ts"

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
  const [llmService, setLlmService] = useState<LLMServiceKey>('chatgpt')
  const [llmModel, setLlmModel] = useState('')
  const [selectedPrompts, setSelectedPrompts] = useState(['shortSummary'])
  const [result] = useState<ResultType | null>(null)
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
  const [_llmCosts, setLlmCosts] = useState<any>({})
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

  return (
    <>
      {currentStep === 0 && (
        <WalletStep
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          setError={setError}
          walletAddress={walletAddress}
          setWalletAddress={setWalletAddress}
          mnemonic={mnemonic}
          setMnemonic={setMnemonic}
          dashBalance={dashBalance}
          setDashBalance={setDashBalance}
          setCurrentStep={setCurrentStep}
        />
      )}
      {currentStep === 1 && (
        <ProcessTypeStep
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          setError={setError}
          processType={processType}
          setProcessType={setProcessType}
          url={url}
          setUrl={setUrl}
          filePath={filePath}
          setFilePath={setFilePath}
          setFinalPath={setFinalPath}
          setFrontMatter={setFrontMatter}
          setMetadata={setMetadata}
          setTranscriptionCosts={setTranscriptionCosts}
          setCurrentStep={setCurrentStep}
        />
      )}
      {currentStep === 2 && (
        <TranscriptionStep
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          setError={setError}
          transcriptionService={transcriptionService}
          setTranscriptionService={setTranscriptionService}
          transcriptionModel={transcriptionModel}
          setTranscriptionModel={setTranscriptionModel}
          transcriptionApiKey={transcriptionApiKey}
          setTranscriptionApiKey={setTranscriptionApiKey}
          finalPath={finalPath}
          setTranscriptContent={setTranscriptContent}
          setTranscriptionModelUsed={setTranscriptionModelUsed}
          setTranscriptionCostUsed={setTranscriptionCostUsed}
          transcriptionCosts={transcriptionCosts}
          setCurrentStep={setCurrentStep}
        />
      )}
      {currentStep === 3 && (
        <PromptsStep
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          setError={setError}
          transcriptContent={transcriptContent}
          selectedPrompts={selectedPrompts}
          setSelectedPrompts={setSelectedPrompts}
          finalPath={finalPath}
          frontMatter={frontMatter}
          setFinalMarkdownFile={setFinalMarkdownFile}
          setLlmCosts={setLlmCosts}
          setCurrentStep={setCurrentStep}
        />
      )}
      {currentStep === 4 && (
        <LLMServiceStep
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          setError={setError}
          llmService={llmService}
          setLlmService={setLlmService}
          llmModel={llmModel}
          setLlmModel={setLlmModel}
          llmApiKey={llmApiKey}
          setLlmApiKey={setLlmApiKey}
          selectedLlmApiKeyService={selectedLlmApiKeyService}
          setSelectedLlmApiKeyService={setSelectedLlmApiKeyService}
          finalMarkdownFile={finalMarkdownFile}
          transcriptionService={transcriptionService}
          transcriptionModelUsed={transcriptionModelUsed}
          transcriptionCostUsed={transcriptionCostUsed}
          metadata={metadata}
          onNewShowNote={onNewShowNote}
        />
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