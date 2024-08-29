// server/playlist.js

import { processPlaylist } from '../../src/commands/processPlaylist.js'

const handlePlaylistRequest = async (req, res) => {
  let body = ''

  req.on('data', chunk => {
    body += chunk.toString()
  })

  req.on('end', async () => {
    try {
      const { playlistUrl, model = 'base', llm } = JSON.parse(body)
      if (!playlistUrl) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Playlist URL is required' }))
        return
      }
      const llmOption = llm || null
      await processPlaylist(playlistUrl, llmOption, model)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ 
        message: 'Playlist processed successfully.'
      }))
    } catch (error) {
      console.error('Error processing playlist:', error)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'An error occurred while processing the playlist' }))
    }
  })
}

export { handlePlaylistRequest }