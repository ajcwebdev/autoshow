// web/src/components/Form.tsx

import { createSignal } from 'solid-js'
import { WalletStep } from './groups/Wallet'
import { ProcessTypeStep } from './groups/ProcessType'
import { TranscriptionStep } from './groups/TranscriptionService'
import { PromptsStep } from './groups/Prompts'
import { LLMServiceStep } from './groups/LLMService'
import '../styles/global.css'
import type { AlertProps, FormProps, ProcessTypeEnum, LLMServiceKey, ShowNoteMetadata, TranscriptionCosts } from '../types.ts'

export const Alert = (props: AlertProps) => (
  <div class={`alert ${props.variant}`}>
    <p>{props.message}</p>
  </div>
)

export default function Form(props: FormProps) {
  const [currentStep, setCurrentStep] = createSignal(0)
  const [walletAddress, setWalletAddress] = createSignal('yhGfbjKDuTnJyx8wzje7n9wsoWC51WH7Y5')
  const [mnemonic, setMnemonic] = createSignal('tip punch promote click scheme guitar skirt lucky hamster clip denial ecology')
  const [processType, setProcessType] = createSignal<ProcessTypeEnum>('file')
  const [url, setUrl] = createSignal('https://www.youtube.com/watch?v=MORMZXEaONk')
  const [filePath, setFilePath] = createSignal('content/examples/audio.mp3')
  const [finalPath, setFinalPath] = createSignal('')
  const [metadata, setMetadata] = createSignal<Partial<ShowNoteMetadata>>({})
  const [frontMatter, setFrontMatter] = createSignal('')
  const [finalMarkdownFile, setFinalMarkdownFile] = createSignal('')
  const [transcriptionService, setTranscriptionService] = createSignal('deepgram')
  const [transcriptionModel, setTranscriptionModel] = createSignal('nano')
  const [transcriptionModelUsed, setTranscriptionModelUsed] = createSignal('')
  const [transcriptionApiKey, setTranscriptionApiKey] = createSignal('')
  const [transcriptionCosts, setTranscriptionCosts] = createSignal<TranscriptionCosts>({})
  const [transcriptionCostUsed, setTranscriptionCostUsed] = createSignal<number | null>(null)
  const [transcriptContent, setTranscriptContent] = createSignal('')
  const [selectedPrompts, setSelectedPrompts] = createSignal(['shortSummary'])
  const [llmService, setLlmService] = createSignal<LLMServiceKey>('chatgpt')
  const [llmModel, setLlmModel] = createSignal('chatgpt-4o-mini')
  const [llmApiKey, setLlmApiKey] = createSignal('')
  const [llmCosts, setLlmCosts] = createSignal<Record<string, any>>({})
  const [error, setError] = createSignal<string | null>(null)
  const [isLoading, setIsLoading] = createSignal(false)
  const [dashBalance, setDashBalance] = createSignal<number | null>(null)

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
          setTranscriptContent={setTranscriptContent}
          setTranscriptionModelUsed={setTranscriptionModelUsed}
          setTranscriptionCostUsed={setTranscriptionCostUsed}
          transcriptionCosts={transcriptionCosts()}
          setCurrentStep={setCurrentStep}
        />
      )}
      {currentStep() === 3 && (
        <PromptsStep
          isLoading={isLoading()}
          setIsLoading={setIsLoading}
          setError={setError}
          transcriptContent={transcriptContent()}
          selectedPrompts={selectedPrompts()}
          setSelectedPrompts={setSelectedPrompts}
          finalPath={finalPath()}
          frontMatter={frontMatter()}
          setFinalMarkdownFile={setFinalMarkdownFile}
          setCurrentStep={setCurrentStep}
          setLlmCosts={setLlmCosts}
        />
      )}
      {currentStep() === 4 && (
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
          finalMarkdownFile={finalMarkdownFile()}
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