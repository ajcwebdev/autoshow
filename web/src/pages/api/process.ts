// web/src/pages/api/process.ts

import type { APIRoute } from 'astro'
import { processVideo } from '../../../../src/process-commands/video'
import { processChannel } from '../../../../src/process-commands/channel'
import { processPlaylist } from '../../../../src/process-commands/playlist'
import { processRSS } from '../../../../src/process-commands/rss'
import { processURLs } from '../../../../src/process-commands/urls'
import { processFile } from '../../../../src/process-commands/file'
import { validateRequest, isValidProcessType } from '../../../../src/utils/validate-option'
import { l, err } from '../../../../src/utils/logging'

// POST /api/process
export const POST: APIRoute = async ({ request }) => {
  try {
    const requestData = await request.json()

    const { type } = requestData

    if (!type || !isValidProcessType(type)) {
      return new Response(
        JSON.stringify({ error: 'Valid process type is required' }),
        { status: 400 }
      )
    }

    // Map request data to processing options
    const { options, llmServices, transcriptServices } = validateRequest(requestData)

    switch (type) {
      case 'video': {
        const { url } = requestData
        if (!url) {
          return new Response(JSON.stringify({ error: 'YouTube URL is required' }), { status: 400 })
        }
        options.video = url
        const content = await processVideo(options, url, llmServices, transcriptServices)
        return new Response(JSON.stringify({ content }), { status: 200 })
      }

      case 'channel': {
        const { url } = requestData
        if (!url) {
          return new Response(JSON.stringify({ error: 'Channel URL is required' }), { status: 400 })
        }
        options.channel = url
        const content = await processChannel(options, url, llmServices, transcriptServices)
        return new Response(JSON.stringify({ content }), { status: 200 })
      }

      case 'urls': {
        const { filePath } = requestData
        if (!filePath) {
          return new Response(JSON.stringify({ error: 'File path is required' }), { status: 400 })
        }
        options.urls = filePath
        await processURLs(options, filePath, llmServices, transcriptServices)
        return new Response(JSON.stringify({ message: 'URLs processed successfully.' }), { status: 200 })
      }

      case 'rss': {
        const { url } = requestData
        if (!url) {
          return new Response(JSON.stringify({ error: 'RSS URL is required' }), { status: 400 })
        }
        options.rss = url
        await processRSS(options, url, llmServices, transcriptServices)
        return new Response(JSON.stringify({ message: 'RSS feed processed successfully.' }), { status: 200 })
      }

      case 'playlist': {
        const { url } = requestData
        if (!url) {
          return new Response(JSON.stringify({ error: 'Playlist URL is required' }), { status: 400 })
        }
        options.playlist = url
        await processPlaylist(options, url, llmServices, transcriptServices)
        return new Response(JSON.stringify({ message: 'Playlist processed successfully.' }), { status: 200 })
      }

      case 'file': {
        const { filePath } = requestData
        if (!filePath) {
          return new Response(JSON.stringify({ error: 'File path is required' }), { status: 400 })
        }
        options.file = filePath
        await processFile(options, filePath, llmServices, transcriptServices)
        return new Response(JSON.stringify({ message: 'File processed successfully.' }), { status: 200 })
      }

      default: {
        // Should never hit because we validated the type, but just in case
        return new Response(JSON.stringify({ error: 'Unsupported process type.' }), { status: 400 })
      }
    }
  } catch (error: any) {
    err('Error processing request:', error)
    return new Response(
      JSON.stringify({ error: 'An error occurred while processing the request.' }),
      { status: 500 }
    )
  }
}