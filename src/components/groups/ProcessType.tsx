// src/components/groups/ProcessType.tsx

import { For, Show } from 'solid-js'
import type { Setter } from 'solid-js'
import { PROCESS_TYPES } from '../../types.ts'
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
  const logPrefix = '[ProcessTypeStep]'
  const handleStepOne = async (): Promise<void> => {
    console.log(`${logPrefix} handleStepOne called`)
    props.setIsLoading(true)
    console.log(`${logPrefix} isLoading set to true`)
    props.setError(null)
    console.log(`${logPrefix} error set to null`)
    props.setTranscriptionCosts({})
    console.log(`${logPrefix} transcriptionCosts reset`)
    try {
      const body: any = { type: props.processType, options: {} }
      if (props.processType === 'video') {
        body.url = props.url
        body.options.video = props.url
        console.log(`${logPrefix} Prepared body for video type`, body)
      } else {
        body.filePath = props.filePath
        body.options.file = props.filePath
        console.log(`${logPrefix} Prepared body for file type`, body)
      }
      console.log(`${logPrefix} Sending request to /api/download-audio`)
      const res = await fetch('http://localhost:4321/api/download-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      console.log(`${logPrefix} Received response from /api/download-audio with status ${res.status}`)
      if (!res.ok) {
        const errorData = await res.json()
        console.error(`${logPrefix} Download audio error response:`, errorData)
        throw new Error(`Error downloading audio: ${errorData.error || res.statusText}`)
      }
      const resData = await res.json()
      console.log(`${logPrefix} Successfully parsed response from /api/download-audio:`, resData)
      props.setFrontMatter(resData.frontMatter || '')
      console.log(`${logPrefix} Set frontMatter (length: ${resData.frontMatter?.length ?? 0})`)
      props.setMetadata(resData.metadata || {})
      console.log(`${logPrefix} Set metadata:`, resData.metadata)
      props.setFinalPath(resData.finalPath || '')
      console.log(`${logPrefix} Set finalPath:`, resData.finalPath)
      if (resData.transcriptionCost) {
        props.setTranscriptionCosts(resData.transcriptionCost)
        console.log(`${logPrefix} Set transcriptionCosts:`, resData.transcriptionCost)
      } else {
        console.warn(`${logPrefix} No transcriptionCost found in response`)
      }
      props.setCurrentStep(2)
      console.log(`${logPrefix} Set currentStep to 2`)
    } catch (err) {
      console.error(`${logPrefix} Error in handleStepOne:`, err)
      if (err instanceof Error) {
        props.setError(err.message)
        console.log(`${logPrefix} Set error state to: ${err.message}`)
      } else {
        props.setError('An unknown error occurred.')
        console.log(`${logPrefix} Set error state to: An unknown error occurred.`)
      }
    } finally {
      props.setIsLoading(false)
      console.log(`${logPrefix} isLoading set to false in finally block`)
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
            console.log(`${logPrefix} Process type changed to: ${value}`)
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
            onInput={e => {
              const value = e.target.value
              console.log(`${logPrefix} URL input changed: ${value}`)
              props.setUrl(value)
            }}
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
            onInput={e => {
              const value = e.target.value
              console.log(`${logPrefix} File path input changed: ${value}`)
              props.setFilePath(value)
            }}
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