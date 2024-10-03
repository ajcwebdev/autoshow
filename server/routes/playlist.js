// server/routes/playlist.js

import { processPlaylist } from '../../src/commands/processPlaylist.js' // Import processPlaylist function
import { reqToOpts } from '../utils/reqToOpts.js' // Import utility function

// Handler for /playlist route
const handlePlaylistRequest = async (request, reply) => {
  console.log('Entered handlePlaylistRequest')

  try {
    const requestData = request.body // Access parsed request body
    console.log('Parsed request body:', requestData)

    const { playlistUrl } = requestData // Extract playlist URL

    if (!playlistUrl) {
      console.log('Playlist URL not provided, sending 400')
      reply.status(400).send({ error: 'Playlist URL is required' }) // Send 400 Bad Request
      return
    }

    // Map request data to processing options
    const { options, llmOpt, transcriptOpt } = reqToOpts(requestData)
    console.log('Calling processPlaylist with params:', { playlistUrl, llmOpt, transcriptOpt, options })

    await processPlaylist(playlistUrl, llmOpt, transcriptOpt, options) // Process the playlist

    console.log('processPlaylist completed successfully')
    reply.send({ message: 'Playlist processed successfully.' }) // Send success response
  } catch (error) {
    console.error('Error processing playlist:', error)
    reply.status(500).send({ error: 'An error occurred while processing the playlist' }) // Send 500 Internal Server Error
  }
}

export { handlePlaylistRequest } // Export the handler function