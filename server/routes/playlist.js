// server/routes/playlist.js

import { processPlaylist } from '../../src/commands/processPlaylist.js'
import { reqToOpts } from '../utils/reqToOpts.js'

// Handler for /playlist route
const handlePlaylistRequest = async (request, reply) => {
  console.log('Entered handlePlaylistRequest')

  try {
    // Access parsed request body
    const requestData = request.body
    console.log('Parsed request body:', requestData)

    // Extract playlist URL
    const { playlistUrl } = requestData

    if (!playlistUrl) {
      console.log('Playlist URL not provided, sending 400')
      reply.status(400).send({ error: 'Playlist URL is required' })
      return
    }

    // Map request data to processing options
    const { options, llmOpt, transcriptOpt } = reqToOpts(requestData)
    console.log('Calling processPlaylist with params:', { playlistUrl, llmOpt, transcriptOpt, options })

    await processPlaylist(playlistUrl, llmOpt, transcriptOpt, options)

    console.log('processPlaylist completed successfully')
    reply.send({ message: 'Playlist processed successfully.' })
  } catch (error) {
    console.error('Error processing playlist:', error)
    reply.status(500).send({ error: 'An error occurred while processing the playlist' })
  }
}

export { handlePlaylistRequest }