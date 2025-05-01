// src/components/groups/ProcessType.tsx

import { For, Show } from 'solid-js'
import type { Setter } from 'solid-js'
import { PROCESS_TYPES } from '../../constants.ts'
import type { ProcessTypeEnum, ShowNoteMetadata, TranscriptionCosts } from '../../types.ts'
export const ProcessTypeStep = (props: {
  isLoading: boolean
  setIsLoading: Setter<boolean>
  setError: Setter<string | null>
  processType: ProcessTypeEnum
  setProcessType: Setter<ProcessTypeEnum>
  url: string
  setUrl: Setter<string>
  filePath: string
  setFilePath: Setter<string>
  setFinalPath: Setter<string>
  setFrontMatter: Setter<string>
  setMetadata: Setter<Partial<ShowNoteMetadata>>
  setTranscriptionCosts: Setter<TranscriptionCosts>
  setCurrentStep: Setter<number>
}) => {
  const handleStepOne = async () => {
    props.setIsLoading(true)
    props.setError(null)
    props.setTranscriptionCosts({})
    try {
      const body: any = { type: props.processType, options: {} }
      if (props.processType === 'video') {
        body.url = props.url
        body.options.video = props.url
      } else {
        body.filePath = props.filePath
        body.options.file = props.filePath
      }
      console.log("Sending download request:", JSON.stringify(body))
      const res = await fetch('http://localhost:4321/api/download-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        console.error("Download audio error:", errorData)
        throw new Error(`Error downloading audio: ${errorData.error || res.statusText}`)
      }
      
      const resData = await res.json()
      console.log("Download audio response:", JSON.stringify(resData))
      
      props.setFrontMatter(resData.frontMatter || '')
      props.setMetadata(resData.metadata || {})
      props.setFinalPath(resData.finalPath || '')
      
      // Use the outputPath from download-audio response directly
      const localFilePath = resData.outputPath
      console.log(`Using output path from download-audio: ${localFilePath}`)
      
      const costBody = { type: 'transcriptCost', filePath: localFilePath }
      console.log("Sending cost request:", JSON.stringify(costBody))
      
      const response = await fetch('http://localhost:4321/api/cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(costBody)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error("Cost calculation error:", errorData)
        throw new Error(`Failed to get transcription cost: ${errorData.error || response.statusText}`)
      }
      
      const data = await response.json() as { transcriptCost: TranscriptionCosts }
      console.log("Cost calculation response:", JSON.stringify(data))
      
      props.setTranscriptionCosts(data.transcriptCost)
      props.setCurrentStep(2)
    } catch (err) {
      console.error("Step One Error:", err)
      if (err instanceof Error) props.setError(err.message)
      else props.setError('An unknown error occurred.')
    } finally {
      props.setIsLoading(false)
    }
  }
  return (
    <>
      <div class="form-group">
        <label for="processType">Process Type</label>
        <select
          id="processType"
          value={props.processType}
          onInput={e => props.setProcessType(e.target.value as ProcessTypeEnum)}
        >
          <For each={PROCESS_TYPES}>
            {type => (
              <option value={type.value}>
                {type.label}
              </option>
            )}
          </For>
        </select>
      </div>
      <Show when={props.processType === 'video'}>
        <div class="form-group">
          <label for="url">
            YouTube URL
          </label>
          <input
            type="text"
            id="url"
            value={props.url}
            onInput={e => props.setUrl(e.target.value)}
            required
          />
        </div>
      </Show>
      <Show when={props.processType === 'file'}>
        <div class="form-group">
          <label for="filePath">File Path</label>
          <input
            type="text"
            id="filePath"
            value={props.filePath}
            onInput={e => props.setFilePath(e.target.value)}
            required
          />
        </div>
      </Show>
      <button disabled={props.isLoading} onClick={handleStepOne}>
        {props.isLoading ? 'Calculating...' : 'Calculate Transcription Cost'}
      </button>
    </>
  )
}