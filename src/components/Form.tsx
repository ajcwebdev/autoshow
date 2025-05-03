// src/components/Form.tsx

import { createSignal } from 'solid-js'
import { WalletStep } from './groups/Wallet'
import { ProcessTypeStep } from './groups/ProcessType'
import { TranscriptionStep } from './groups/TranscriptionService'
import { LLMServiceStep } from './groups/LLMService'
import '../styles/global.css'
import type { AlertProps, FormProps, ProcessTypeEnum, LLMServiceKey, ShowNoteMetadata, TranscriptionCosts } from '../types.ts'
export const Alert = (props: AlertProps) => (
  <div class={`alert ${props.variant}`}>
    <p>{props.message}</p>
  </div>
)
export default function Form(props: FormProps) {
  const logPrefix = '[Form]'
  const [currentStep, setCurrentStep] = createSignal(1)
  console.log(`${logPrefix} Initial currentStep: ${currentStep()}`)
  const [walletAddress, setWalletAddress] = createSignal('yhGfbjKDuTnJyx8wzje7n9wsoWC51WH7Y5')
  console.log(`${logPrefix} Initial walletAddress: ${walletAddress()}`)
  const [mnemonic, setMnemonic] = createSignal('tip punch promote click scheme guitar skirt lucky hamster clip denial ecology')
  console.log(`${logPrefix} Initial mnemonic set (redacted)`)
  const [processType, setProcessType] = createSignal<ProcessTypeEnum>('video')
  console.log(`${logPrefix} Initial processType: ${processType()}`)
  const [url, setUrl] = createSignal('https://www.youtube.com/watch?v=MORMZXEaONk')
  console.log(`${logPrefix} Initial url: ${url()}`)
  const [filePath, setFilePath] = createSignal('autoshow/content/examples/audio.mp3')
  console.log(`${logPrefix} Initial filePath: ${filePath()}`)
  const [finalPath, setFinalPath] = createSignal('')
  console.log(`${logPrefix} Initial finalPath: ${finalPath()}`)
  const [s3Url, setS3Url] = createSignal('')
  console.log(`${logPrefix} Initial s3Url: ${s3Url()}`)
  const [metadata, setMetadata] = createSignal<Partial<ShowNoteMetadata>>({})
  console.log(`${logPrefix} Initial metadata: {}`)
  const [frontMatter, setFrontMatter] = createSignal('')
  console.log(`${logPrefix} Initial frontMatter: ""`)
  const [transcriptionService, setTranscriptionService] = createSignal('deepgram')
  console.log(`${logPrefix} Initial transcriptionService: ${transcriptionService()}`)
  const [transcriptionModel, setTranscriptionModel] = createSignal('nova-2')
  console.log(`${logPrefix} Initial transcriptionModel: ${transcriptionModel()}`)
  const [transcriptionModelUsed, setTranscriptionModelUsed] = createSignal('')
  console.log(`${logPrefix} Initial transcriptionModelUsed: ""`)
  const [transcriptionApiKey, setTranscriptionApiKey] = createSignal('')
  console.log(`${logPrefix} Initial transcriptionApiKey set (empty)`)
  const [transcriptionCosts, setTranscriptionCosts] = createSignal<TranscriptionCosts>({})
  console.log(`${logPrefix} Initial transcriptionCosts: {}`)
  const [transcriptionCostUsed, setTranscriptionCostUsed] = createSignal<number | null>(null)
  console.log(`${logPrefix} Initial transcriptionCostUsed: null`)
  const [transcriptContent, setTranscriptContent] = createSignal('')
  console.log(`${logPrefix} Initial transcriptContent: ""`)
  const [selectedPrompts, setSelectedPrompts] = createSignal(['shortSummary'])
  console.log(`${logPrefix} Initial selectedPrompts: ${selectedPrompts().join(', ')}`)
  const [promptText, setPromptText] = createSignal('')
  console.log(`${logPrefix} Initial promptText: ""`)
  const [llmService, setLlmService] = createSignal<LLMServiceKey>('chatgpt')
  console.log(`${logPrefix} Initial llmService: ${llmService()}`)
  const [llmModel, setLlmModel] = createSignal('gpt-4o-mini')
  console.log(`${logPrefix} Initial llmModel: ${llmModel()}`)
  const [llmApiKey, setLlmApiKey] = createSignal('')
  console.log(`${logPrefix} Initial llmApiKey set (empty)`)
  const [llmCosts, setLlmCosts] = createSignal<Record<string, any>>({})
  console.log(`${logPrefix} Initial llmCosts: {}`)
  const [error, setError] = createSignal<string | null>(null)
  console.log(`${logPrefix} Initial error: null`)
  const [isLoading, setIsLoading] = createSignal(false)
  console.log(`${logPrefix} Initial isLoading: false`)
  const [dashBalance, setDashBalance] = createSignal<number | null>(null)
  console.log(`${logPrefix} Initial dashBalance: null`)
  return (
    <>
      {currentStep() === 0 && (
        <WalletStep
          isLoading={isLoading()}
          setIsLoading={setIsLoading}
          setError={setError}
          walletAddress={walletAddress()}
          setWalletAddress={setWalletAddress}
          mnemonic={mnemonic()}
          setMnemonic={setMnemonic}
          dashBalance={dashBalance()}
          setDashBalance={setDashBalance}
          setCurrentStep={setCurrentStep}
        />
      )}
      {currentStep() === 1 && (
        <ProcessTypeStep
          isLoading={isLoading()}
          setIsLoading={setIsLoading}
          setError={setError}
          processType={processType()}
          setProcessType={setProcessType}
          url={url()}
          setUrl={setUrl}
          filePath={filePath()}
          setFilePath={setFilePath}
          setFinalPath={setFinalPath}
          setS3Url={setS3Url}
          setFrontMatter={setFrontMatter}
          setMetadata={setMetadata}
          setTranscriptionCosts={setTranscriptionCosts}
          setCurrentStep={setCurrentStep}
        />
      )}
      {currentStep() === 2 && (
        <TranscriptionStep
          isLoading={isLoading()}
          setIsLoading={setIsLoading}
          setError={setError}
          transcriptionService={transcriptionService()}
          setTranscriptionService={setTranscriptionService}
          transcriptionModel={transcriptionModel()}
          setTranscriptionModel={setTranscriptionModel}
          transcriptionApiKey={transcriptionApiKey()}
          setTranscriptionApiKey={setTranscriptionApiKey}
          finalPath={finalPath()}
          s3Url={s3Url()}
          setTranscriptContent={setTranscriptContent}
          setTranscriptionModelUsed={setTranscriptionModelUsed}
          setTranscriptionCostUsed={setTranscriptionCostUsed}
          transcriptionCosts={transcriptionCosts()}
          selectedPrompts={selectedPrompts()}
          setSelectedPrompts={setSelectedPrompts}
          setLlmCosts={setLlmCosts}
          setPromptText={setPromptText}
          setCurrentStep={setCurrentStep}
        />
      )}
      {currentStep() === 3 && (
        <LLMServiceStep
          isLoading={isLoading()}
          setIsLoading={setIsLoading}
          setError={setError}
          llmService={llmService()}
          setLlmService={setLlmService}
          llmModel={llmModel()}
          setLlmModel={setLlmModel}
          llmApiKey={llmApiKey()}
          setLlmApiKey={setLlmApiKey}
          frontMatter={frontMatter()}
          promptText={promptText()}
          transcript={transcriptContent()}
          transcriptionService={transcriptionService()}
          transcriptionModelUsed={transcriptionModelUsed()}
          transcriptionCostUsed={transcriptionCostUsed()}
          metadata={metadata()}
          onNewShowNote={props.onNewShowNote}
          llmCosts={llmCosts()}
        />
      )}
      {error() && <Alert message={error()!} variant="error" />}
    </>
  )
}