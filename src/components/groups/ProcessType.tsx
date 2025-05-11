// src/components/groups/ProcessType.tsx

import { For, Show } from 'solid-js'
import type { Setter } from 'solid-js'
import { PROCESS_TYPES } from '../../types.ts'
import type { ProcessTypeEnum, ShowNoteMetadata, TranscriptionCosts } from '../../types.ts'

const l = console.log
const err = console.error

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
  setS3Url: Setter<string>
  setFrontMatter: Setter<string>
  setMetadata: Setter<Partial<ShowNoteMetadata>>
  setTranscriptionCosts: Setter<TranscriptionCosts>
  setCurrentStep: Setter<number>
  setShowNoteId: Setter<number>
}) => {
  const handleStepOne = async (): Promise<void> => {
    l(`[ProcessTypeStep] Starting audio processing for ${props.processType} type`)
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
      
      l(`[ProcessTypeStep] Sending download-audio request for ${props.processType}`)
      const res = await fetch('http://localhost:4321/api/download-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        err(`[ProcessTypeStep] Download audio error:`, errorData)
        throw new Error(`Error downloading audio: ${errorData.error || res.statusText}`)
      }
      
      const resData = await res.json()
      
      props.setFrontMatter(resData.frontMatter || '')
      props.setMetadata(resData.metadata || {})
      props.setFinalPath(resData.finalPath || '')
      props.setS3Url(resData.s3Url || '')
      props.setShowNoteId(resData.id)
      
      if (resData.transcriptionCost) {
        props.setTranscriptionCosts(resData.transcriptionCost)
      } else {
        console.warn(`[ProcessTypeStep] No transcriptionCost found in response`)
      }
      
      l(`[ProcessTypeStep] Successfully processed ${props.processType}, received showNoteId: ${resData.id}, moving to step 2`)
      props.setCurrentStep(2)
    } catch (error) {
      err(`[ProcessTypeStep] Error in handleStepOne:`, error)
      if (error instanceof Error) {
        props.setError(error.message)
      } else {
        props.setError('An unknown error occurred.')
      }
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
          onInput={e => {
            const value = e.target.value as ProcessTypeEnum
            props.setProcessType(value)
          }}
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
        {props.isLoading ? 'Processing...' : 'Start Processing & Calculate Costs'}
      </button>
    </>
  )
}