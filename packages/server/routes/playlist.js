// server/routes/playlist.js

import { processPlaylist } from '../../../src/commands/processPlaylist.js'
import { reqToOpts } from '../utils/reqToOpts.js'

// Handler for /playlist route
const handlePlaylistRequest = async (request, reply) => {
  console.log('\nEntered handlePlaylistRequest')

  try {
    // Access parsed request body
    const requestData = request.body
    console.log('\nParsed request body:', requestData)

    // Extract playlist URL
    const { playlistUrl } = requestData

    if (!playlistUrl) {
      console.log('Playlist URL not provided, sending 400')
      reply.status(400).send({ error: 'Playlist URL is required' })
      return
    }

    // Map request data to processing options
    const { options, llmServices, transcriptServices } = reqToOpts(requestData)
    console.log('\nCalling processPlaylist with params:', { playlistUrl, llmServices, transcriptServices, options })

    await processPlaylist(playlistUrl, llmServices, transcriptServices, options)

    console.log('\nprocessPlaylist completed successfully')
    reply.send({ message: 'Playlist processed successfully.' })
  } catch (error) {
    console.error('Error processing playlist:', error)
    reply.status(500).send({ error: 'An error occurred while processing the playlist' })
  }
}

export { handlePlaylistRequest }