// server/routes/playlist.js

import { processPlaylist } from '../../src/commands/processPlaylist.js'

const handlePlaylistRequest = async (req, res) => {
  console.log('Entered handlePlaylistRequest')
  let body = ''

  req.on('data', chunk => {
    body += chunk.toString()
    console.log('Received chunk:', chunk.toString())
  })

  req.on('end', async () => {
    console.log('Request body complete:', body)
    try {
      const { playlistUrl, model = 'base', llm, options = {} } = JSON.parse(body)
      console.log('Parsed request body:', { playlistUrl, model, llm, options })
      if (!playlistUrl) {
        console.log('Playlist URL not provided, sending 400')
        res.statusCode = 400
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'Playlist URL is required' }))
        return
      }
      const llmOption = llm || null
      await processPlaylist(playlistUrl, llmOption, model, options)
      console.log('processPlaylist completed successfully')
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ 
        message: 'Playlist processed successfully.'
      }))
    } catch (error) {
      console.error('Error processing playlist:', error)
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'An error occurred while processing the playlist' }))
    }
  })
}

export { handlePlaylistRequest }