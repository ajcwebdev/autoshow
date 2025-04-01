import { processVideo } from './video.ts'
import { checkAndHandleInfo } from './info-utils.ts'
import { l, err, logSeparator, logInitialFunctionCall } from '../utils/logging.ts'
import { execFilePromise } from '../utils/node-utils.ts'
import type { ProcessingOptions } from '../../shared/types.ts'

export async function processPlaylist(
  options: ProcessingOptions,
  playlistUrl: string,
  llmServices?: string,
  transcriptServices?: string
) {
  logInitialFunctionCall('processPlaylist', { llmServices, transcriptServices })
  try {
    const { stdout, stderr } = await execFilePromise('yt-dlp', [
      '--dump-single-json',
      '--flat-playlist',
      '--no-warnings',
      playlistUrl
    ])
    if (stderr) {
      err(`yt-dlp warnings: ${stderr}`)
    }
    const playlistData: { title: string, entries: Array<{ id: string }> } = JSON.parse(stdout)
    const playlistTitle = playlistData.title
    const entries = playlistData.entries
    const urls: string[] = entries.map((entry) => `https://www.youtube.com/watch?v=${entry.id}`)
    if (urls.length === 0) {
      err('Error: No videos found in the playlist.')
      process.exit(1)
    }
    l.opts(`\nFound ${urls.length} videos in the playlist: ${playlistTitle}...`)

    // Info check
    const handledInfo = await checkAndHandleInfo(options, 'playlist', urls, playlistTitle)
    if (handledInfo) {
      return
    }

    for (const [index, url] of urls.entries()) {
      logSeparator({
        type: 'playlist',
        index,
        total: urls.length,
        descriptor: url
      })
      try {
        await processVideo(options, url, llmServices, transcriptServices)
      } catch (error) {
        err(`Error processing video ${url}: ${(error as Error).message}`)
      }
    }
  } catch (error) {
    err(`Error processing playlist: ${(error as Error).message}`)
    process.exit(1)
  }
}
