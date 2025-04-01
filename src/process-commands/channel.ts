import { processVideo } from './video.ts'
import { validateChannelOptions, logChannelProcessingStatus } from './channel-utils.ts'
import { checkAndHandleInfo } from './info-utils.ts'
import { l, err, logSeparator, logInitialFunctionCall } from '../utils/logging.ts'
import { execFilePromise } from '../utils/node-utils.ts'
import type { ProcessingOptions } from '../../shared/types.ts'

export async function selectVideos(
  stdout: string,
  options: ProcessingOptions
) {
  const videoUrls = stdout.trim().split('\n').filter(Boolean)
  l.opts(`\nFetching detailed information for ${videoUrls.length} videos...`)

  const videoDetailsPromises = videoUrls.map(async (url) => {
    try {
      const { stdout } = await execFilePromise('yt-dlp', [
        '--print', '%(upload_date)s|%(timestamp)s|%(is_live)s|%(webpage_url)s',
        '--no-warnings',
        url
      ])
      const [uploadDate, timestamp, isLive, videoUrl] = stdout.trim().split('|')
      if (!uploadDate || !timestamp || !videoUrl) {
        throw new Error('Incomplete video information received from yt-dlp')
      }
      const year = uploadDate.substring(0, 4)
      const month = uploadDate.substring(4, 6)
      const day = uploadDate.substring(6, 8)
      const date = new Date(`${year}-${month}-${day}`)
      return {
        uploadDate,
        url: videoUrl,
        date,
        timestamp: parseInt(timestamp, 10) || date.getTime() / 1000,
        isLive: isLive === 'True'
      }
    } catch (error) {
      err(`Error getting details for video ${url}: ${error instanceof Error ? error.message : String(error)}`)
      return null
    }
  })

  const videoDetailsResults = await Promise.all(videoDetailsPromises)
  const allVideos = videoDetailsResults.filter((video) => video !== null)
  if (allVideos.length === 0) {
    err('Error: No videos found in the channel.')
    process.exit(1)
  }
  allVideos.sort((a, b) => a.timestamp - b.timestamp)
  if (options.order !== 'oldest') {
    allVideos.reverse()
  }
  l.opts(`\nFound ${allVideos.length} videos in the channel...`)

  let videosToProcess
  if (options.last) {
    videosToProcess = allVideos.slice(0, options.last)
  } else {
    videosToProcess = allVideos.slice(options.skip || 0)
  }
  return { allVideos, videosToProcess }
}

export async function processChannel(
  options: ProcessingOptions,
  channelUrl: string,
  llmServices?: string,
  transcriptServices?: string
) {
  logInitialFunctionCall('processChannel', { llmServices, transcriptServices })
  try {
    validateChannelOptions(options)
    const { stdout, stderr } = await execFilePromise('yt-dlp', [
      '--flat-playlist',
      '--print', '%(url)s',
      '--no-warnings',
      channelUrl
    ])
    if (stderr) {
      err(`yt-dlp warnings: ${stderr}`)
    }
    const { allVideos, videosToProcess } = await selectVideos(stdout, options)
    logChannelProcessingStatus(allVideos.length, videosToProcess.length, options)

    // Unified info-check
    const handledInfo = await checkAndHandleInfo(options, 'channel', videosToProcess, '')
    if (handledInfo) {
      return
    }

    for (const [index, video] of videosToProcess.entries()) {
      const url = video.url
      logSeparator({
        type: 'channel',
        index,
        total: videosToProcess.length,
        descriptor: url
      })
      try {
        await processVideo(options, url, llmServices, transcriptServices)
      } catch (error) {
        err(`Error processing video ${url}: ${(error as Error).message}`)
      }
    }
  } catch (error) {
    err(`Error processing channel: ${(error as Error).message}`)
    process.exit(1)
  }
}
