// web/src/components/groups/ProcessType.tsx

import React from 'react'
import { PROCESS_TYPES } from '../../../../shared/constants.ts'
import type { ProcessTypeEnum } from '../../../../shared/types.ts'

export const ProcessTypeStep: React.FC<{
  isLoading: boolean
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
  setError: React.Dispatch<React.SetStateAction<string | null>>
  processType: ProcessTypeEnum
  setProcessType: React.Dispatch<React.SetStateAction<ProcessTypeEnum>>
  url: string
  setUrl: React.Dispatch<React.SetStateAction<string>>
  filePath: string
  setFilePath: React.Dispatch<React.SetStateAction<string>>
  setFinalPath: React.Dispatch<React.SetStateAction<string>>
  setFrontMatter: React.Dispatch<React.SetStateAction<string>>
  setMetadata: React.Dispatch<React.SetStateAction<any>>
  setTranscriptionCosts: React.Dispatch<React.SetStateAction<any>>
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>
}> = ({
  isLoading,
  setIsLoading,
  setError,
  processType,
  setProcessType,
  url,
  setUrl,
  filePath,
  setFilePath,
  setFinalPath,
  setFrontMatter,
  setMetadata,
  setTranscriptionCosts,
  setCurrentStep
}) => {
  const handleStepOne = async () => {
    setIsLoading(true)
    setError(null)
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

  return (
    <>
      <div className="form-group">
        <label htmlFor="processType">Process Type</label>
        <select
          id="processType"
          value={processType}
          onChange={e => setProcessType(e.target.value as ProcessTypeEnum)}
        >
          {PROCESS_TYPES.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>
      {processType === 'video' && (
        <div className="form-group">
          <label htmlFor="url">
            {processType === 'video'}
            YouTube URL
          </label>
          <input
            type="text"
            id="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            required
          />
        </div>
      )}
      {processType === 'file' && (
        <div className="form-group">
          <label htmlFor="filePath">File Path</label>
          <input
            type="text"
            id="filePath"
            value={filePath}
            onChange={e => setFilePath(e.target.value)}
            required
          />
        </div>
      )}
      <button disabled={isLoading} onClick={handleStepOne}>
        {isLoading ? 'Calculating...' : 'Calculate Transcription Cost'}
      </button>
    </>
  )
}
