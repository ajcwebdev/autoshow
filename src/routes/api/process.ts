// src/routes/api/process.ts

/**
 * Handler for the /process route.
 * Receives and validates the request body, maps request data to processing options,
 * and calls the appropriate process handler based on the provided process type.
 *
 * @param event - APIEvent object containing the incoming request
 * @returns A Promise that resolves to a JSON response
 */

'use server'

import type { APIEvent } from '@solidjs/start/server'
import { processVideo } from '../../process-commands/video'
import { processFile } from '../../process-commands/file'
import { l, err } from '../../utils/logging'
import { envVarsServerMap } from '../../utils/step-utils/llm-utils'
import { validateRequest, validateServerProcessAction } from '../../utils/validate-option'
import { json } from '@solidjs/router'

export async function POST(event: APIEvent) {
  l('\nEntered handleProcessRequest')

  try {
    const requestData = await event.request.json()
    l('\nParsed request body:', requestData)

    const { type } = requestData

    try {
      validateServerProcessAction(type)
    } catch {
      l('Invalid or missing process type, returning 400')
      return json({ error: 'Valid process type is required' }, { status: 400 })
    }

    const { options, llmServices, transcriptServices } = validateRequest(requestData)

    if (llmServices && requestData['llmModel']) {
      options[llmServices] = requestData['llmModel']
    }

    if (requestData) {
      Object.entries(envVarsServerMap).forEach(([bodyKey, envKey]) => {
        const value = (requestData as Record<string, string | undefined>)[bodyKey]
        if (value) {
          process.env[envKey as string] = value
        }
      })
    }

    switch (type) {
      case 'video': {
        const { url } = requestData
        if (!url) {
          return json({ error: 'YouTube URL is required' }, { status: 400 })
        }
        options.video = url
        const result = await processVideo(options, url, llmServices, transcriptServices)
        return json({
          frontMatter: result.frontMatter,
          prompt: result.prompt,
          llmOutput: result.llmOutput,
          transcript: result.transcript,
        })
      }

      case 'file': {
        const { filePath } = requestData
        if (!filePath) {
          return json({ error: 'File path is required' }, { status: 400 })
        }
        options.file = filePath
        const result = await processFile(options, filePath, llmServices, transcriptServices)
        return json({
          frontMatter: result.frontMatter,
          prompt: result.prompt,
          llmOutput: result.llmOutput,
          transcript: result.transcript,
        })
      }
    }

    l('\nProcess completed successfully')
    return json({ success: true })
  } catch (error) {
    err('Error processing request:', error)
    return json({ error: 'An error occurred while processing the request' }, { status: 500 })
  }
}