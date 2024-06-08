// commands/processPlaylist.js

import fs from 'fs'
import youtubedl from 'youtube-dl-exec'
import { processVideo } from './processVideo.js'

export async function processPlaylist(playlistUrl, model, chatgpt, claude, deepgram, assembly) {
  try {
    // Fetch playlist information including episode URLs
    const playlistInfo = await youtubedl(playlistUrl, {
      dumpSingleJson: true,
      flatPlaylist: true,
      noWarnings: true,
      noCheckCertificates: true
    })

    if (!playlistInfo || !playlistInfo.entries) {
      console.error('Failed to retrieve any entries from the playlist.')
      return
    }

    // Save the playlist information to a file
    fs.writeFileSync('content/playlist-info.md', JSON.stringify(playlistInfo, null, 2))
    console.log('Playlist information saved to content/playlist-info.json')

    // Extract URLs from the playlist data
    const urls = playlistInfo.entries
      .filter(entry => entry && entry.url)  // Ensure entry and entry.url are not null
      .map(entry => entry.url)

    if (urls.length === 0) {
      console.error('No valid URLs found in the playlist.')
      return
    }

    // Write URLs to a markdown file
    fs.writeFileSync(`content/urls.md`, urls.join('\n'))

    // Process each video URL in the playlist
    for (const url of urls) {
      await processVideo(url, model, chatgpt, claude, deepgram, assembly)
    }
  } catch (error) {
    console.error('Error processing playlist:', error)
  }
}