// src/process-steps/01-generate-markdown.ts

import { sanitizeTitle, buildFrontMatter } from './01-generate-markdown-utils.ts'
import { l, err, logInitialFunctionCall } from '../utils/logging.ts'
import { execFilePromise, basename, extname } from '../utils/node-utils.ts'

import type { ProcessingOptions, ShowNoteMetadata } from '../../shared/types.ts'

/**
 * Generates markdown content with front matter based on the provided options and input.
 * Handles different content types including YouTube videos, playlists, local files, and RSS items.
 * 
 * The function performs the following steps:
 * 1. Sanitizes input titles for safe filename creation
 * 2. Extracts metadata based on content type
 * 3. Generates appropriate front matter
 * 
 * @param {ProcessingOptions} options - The processing options specifying the type of content to generate.
 *                                     Valid options include: video, playlist, urls, file, and rss.
 * @param {string | ShowNoteMetadata} input - The input data to process:
 *                                   - For video/playlist/urls: A URL string
 *                                   - For file: A file path string
 *                                   - For RSS: An RSSItem object containing feed item details
 * @throws {Error} If invalid options are provided or if metadata extraction fails.
 * 
 * @example
 * // For a YouTube video
 * const result = await generateMarkdown(
 *   { video: true },
 *   'https://www.youtube.com/watch?v=...'
 * )
 * 
 * @example
 * // For an RSS item
 * const result = await generateMarkdown(
 *   { rss: true },
 *   { 
 *     publishDate: '2024-03-21',
 *     title: 'Episode Title',
 *     coverImage: 'https://...',
 *     showLink: 'https://...',
 *     channel: 'Podcast Name',
 *     channelURL: 'https://...'
 *   }
 * )
 */
export async function generateMarkdown(
  options: ProcessingOptions,
  input: string | ShowNoteMetadata
) {
  l.step(`\nStep 1 - Generate Markdown\n`)
  logInitialFunctionCall('generateMarkdown', { options, input })

  const { filename, metadata } = await (async () => {
    switch (true) {
      case !!options.video:
      case !!options.playlist:
      case !!options.urls:
      case !!options.channel:
        try {
          l.dim('  Extracting metadata with yt-dlp. Parsing output...')
          const { stdout } = await execFilePromise('yt-dlp', [
            '--restrict-filenames',
            '--print', '%(webpage_url)s',
            '--print', '%(channel)s',
            '--print', '%(uploader_url)s',
            '--print', '%(title)s',
            '--print', '%(upload_date>%Y-%m-%d)s',
            '--print', '%(thumbnail)s',
            input as string,
          ])

          const [
            showLink = '',
            videoChannel = '',
            uploader_url = '',
            videoTitle = '',
            formattedDate = '',
            thumbnail = '',
          ] = stdout.trim().split('\n')

          const filenameResult = `${formattedDate}-${sanitizeTitle(videoTitle)}`

          return {
            filename: filenameResult,
            metadata: {
              showLink: showLink,
              channel: videoChannel,
              channelURL: uploader_url,
              title: videoTitle,
              description: '',
              publishDate: formattedDate,
              coverImage: thumbnail,
            }
          }
        } catch (error) {
          err(`Error extracting metadata for ${input}: ${error instanceof Error ? error.message : String(error)}`)
          throw error
        }

      case !!options.file:
        l.dim('\n  Generating markdown for a local file...')
        const originalFilename = basename(input as string)
        const filenameWithoutExt = originalFilename.replace(extname(originalFilename), '')
        const localFilename = sanitizeTitle(filenameWithoutExt)

        return {
          filename: localFilename,
          metadata: {
            showLink: originalFilename,
            channel: '',
            channelURL: '',
            title: originalFilename,
            description: '',
            publishDate: '',
            coverImage: '',
          }
        }

      case !!options.rss:
        l.dim('\n  Generating markdown for an RSS item...\n')
        const item = input as ShowNoteMetadata
        const {
          publishDate,
          title: rssTitle,
          coverImage,
          showLink,
          channel: rssChannel,
          channelURL,
        } = item

        const rssFilename = `${publishDate}-${sanitizeTitle(rssTitle)}`

        return {
          filename: rssFilename,
          metadata: {
            showLink: showLink,
            channel: rssChannel,
            channelURL: channelURL,
            title: rssTitle,
            description: '',
            publishDate: publishDate,
            coverImage: coverImage,
          }
        }

      default:
        throw new Error('Invalid option provided for markdown generation.')
    }
  })()

  const finalPath = `content/${filename}`
  const frontMatter = buildFrontMatter({
    showLink: metadata.showLink || '',
    channel: metadata.channel || '',
    channelURL: metadata.channelURL || '',
    title: metadata.title,
    description: metadata.description,
    publishDate: metadata.publishDate || '',
    coverImage: metadata.coverImage || ''
  })
  const frontMatterContent = frontMatter.join('\n')

  l.dim(`\n  generateMarkdown returning:\n\n    - finalPath: ${finalPath}\n    - filename: ${filename}\n`)
  l.dim(`frontMatterContent:\n\n${frontMatterContent}\n`)
  return { frontMatter: frontMatterContent, finalPath, filename, metadata }
}