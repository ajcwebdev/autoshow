// server/routes/playlist.ts

import type { FastifyRequest, FastifyReply } from 'fastify'
import { processPlaylist } from '../../../src/commands/processPlaylist'
import { reqToOpts } from '../utils/reqToOpts'
import { l, err } from '../../../src/globals'

// Handler for the /playlist route
export const handlePlaylistRequest = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  l('\nEntered handlePlaylistRequest')

  try {
    // Access parsed request body
    const requestData = request.body as any
    l('\nParsed request body:', requestData)

    // Extract playlist URL from the request data
    const { playlistUrl } = requestData

    if (!playlistUrl) {
      l('Playlist URL not provided, sending 400')
      reply.status(400).send({ error: 'Playlist URL is required' })
      return
    }

    // Map request data to processing options
    const { options, llmServices, transcriptServices } = reqToOpts(requestData)

    // Set options.playlist to playlistUrl
    options.playlist = playlistUrl

    l('\nCalling processPlaylist with params:', {
      playlistUrl,
      llmServices,
      transcriptServices,
      options,
    })

    // Call processPlaylist with the mapped options and extracted playlist URL
    await processPlaylist(options, playlistUrl, llmServices, transcriptServices)

    l('\nprocessPlaylist completed successfully')
    reply.send({ message: 'Playlist processed successfully.' })
  } catch (error) {
    err('Error processing playlist:', error)
    reply.status(500).send({ error: 'An error occurred while processing the playlist' })
  }
}