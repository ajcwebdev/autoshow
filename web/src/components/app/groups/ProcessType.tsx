// web/src/components/app/groups/ProcessType.tsx

import React from 'react'
import { PROCESS_TYPES } from '@/site-config'
import type { ProcessTypeEnum } from '../../../types'

/**
 * The ProcessType component encapsulates the selection of process type
 * (video or file) along with the related input fields for URLs and file paths.
 *
 * @param {{
 *   processType: ProcessTypeEnum,
 *   setProcessType: React.Dispatch<React.SetStateAction<ProcessTypeEnum>>,
 *   url: string,
 *   setUrl: React.Dispatch<React.SetStateAction<string>>,
 *   filePath: string,
 *   setFilePath: React.Dispatch<React.SetStateAction<string>>
 * }} props
 * @returns {JSX.Element}
 */
export const ProcessType: React.FC<{
  processType: ProcessTypeEnum
  setProcessType: React.Dispatch<React.SetStateAction<ProcessTypeEnum>>
  url: string
  setUrl: React.Dispatch<React.SetStateAction<string>>
  filePath: string
  setFilePath: React.Dispatch<React.SetStateAction<string>>
}> = ({
  processType,
  setProcessType,
  url,
  setUrl,
  filePath,
  setFilePath
}) => {
  return (
    <>
      <div className="form-group">
        <label htmlFor="processType">Process Type</label>
        <select
          id="processType"
          value={processType}
          onChange={(e) => setProcessType(e.target.value as ProcessTypeEnum)}
        >
          {PROCESS_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {(processType === 'video') && (
        <div className="form-group">
          <label htmlFor="url">
            {processType === 'video'}
            YouTube URL
          </label>
          <input
            type="text"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
        </div>
      )}

      {(processType === 'file') && (
        <div className="form-group">
          <label htmlFor="filePath">File Path</label>
          <input
            type="text"
            id="filePath"
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            required
          />
        </div>
      )}
    </>
  )
}