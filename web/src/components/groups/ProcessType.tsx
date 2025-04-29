// web/src/components/groups/ProcessType.tsx

import { For, Show } from 'solid-js'
import type { Setter } from 'solid-js'
import { PROCESS_TYPES } from '../../../../shared/constants.ts'
import type { ProcessTypeEnum, ShowNoteMetadata, TranscriptionCosts } from '../../../../shared/types.ts'

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
      const res = await fetch('http://localhost:3000/download-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!res.ok) throw new Error('Error downloading audio and metadata')
      const resData = await res.json()
      props.setFrontMatter(resData.frontMatter || '')
      props.setMetadata(resData.metadata || {})
      props.setFinalPath(resData.finalPath || '')
      const localFilePath = resData.outputPath
      const costBody = { type: 'transcriptCost', filePath: localFilePath }
      const response = await fetch('http://localhost:3000/api/cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(costBody)
      })
      if (!response.ok) throw new Error('Failed to get transcription cost')
      const data = await response.json() as { transcriptCost: TranscriptionCosts }
      props.setTranscriptionCosts(data.transcriptCost)
      props.setCurrentStep(2)
    } catch (err) {
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