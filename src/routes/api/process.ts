// src/routes/api/process.ts

/**
 * Handler for the /process route.
 * Receives and validates the request body, maps request data to processing options,
 * and calls the appropriate process handler based on the provided process type.
 *
 * @param event - APIEvent object containing the incoming request
 * @returns A Promise that resolves to a Response
 */

'use server'

import type { APIEvent } from '@solidjs/start/server'
import { processVideo } from '../../process-commands/video'
import { processFile } from '../../process-commands/file'
import { l, err } from '../../utils/logging'
import { envVarsServerMap } from '../../utils/step-utils/llm-utils'
import { validateRequest, validateServerProcessAction } from '../../utils/validate-option'
import type { ProcessRequestBody } from '../../utils/types/process'

export async function POST(event: APIEvent): Promise<Response> {
  l('\nEntered handleProcessRequest')

  try {
    const requestData = await event.request.json() as ProcessRequestBody
    l('\nParsed request body:', requestData)

    const { type } = requestData

    try {
      validateServerProcessAction(type)
    } catch {
      l('Invalid or missing process type, returning 400')
      return new Response(JSON.stringify({ error: 'Valid process type is required' }), { status: 400 })
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
          return new Response(JSON.stringify({ error: 'YouTube URL is required' }), { status: 400 })
        }
        options.video = url
        const result = await processVideo(options, url, llmServices, transcriptServices)
        return new Response(JSON.stringify({
          frontMatter: result.frontMatter,
          prompt: result.prompt,
          llmOutput: result.llmOutput,
          transcript: result.transcript,
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      case 'file': {
        const { filePath } = requestData
        if (!filePath) {
          return new Response(JSON.stringify({ error: 'File path is required' }), { status: 400 })
        }
        options.file = filePath
        const result = await processFile(options, filePath, llmServices, transcriptServices)
        return new Response(JSON.stringify({
          frontMatter: result.frontMatter,
          prompt: result.prompt,
          llmOutput: result.llmOutput,
          transcript: result.transcript,
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }

    l('\nProcess completed successfully')
    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (error) {
    err('Error processing request:', error)
    return new Response(JSON.stringify({ error: 'An error occurred while processing the request' }), { status: 500 })
  }
}