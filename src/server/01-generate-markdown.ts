// src/server/generate-markdown.ts

import { l, err, logInitialFunctionCall } from '../utils/logging.ts'
import { execFilePromise, basename, extname } from '../utils/node-utils.ts'
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { ProcessingOptions, ShowNoteMetadata, GenerateMarkdownBody } from '../../shared/types.ts'

export function sanitizeTitle(title: string) {
  return title
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
    .slice(0, 200)
}

export function buildFrontMatter(metadata: {
  showLink: string
  channel: string
  channelURL: string
  title: string
  description: string
  publishDate: string
  coverImage: string
}) {
  return [
    '---',
    `showLink: "${metadata.showLink}"`,
    `channel: "${metadata.channel}"`,
    `channelURL: "${metadata.channelURL}"`,
    `title: "${metadata.title}"`,
    `description: "${metadata.description}"`,
    `publishDate: "${metadata.publishDate}"`,
    `coverImage: "${metadata.coverImage}"`,
    '---\n',
  ]
}

export async function generateMarkdown(
  options: ProcessingOptions,
  input: string | ShowNoteMetadata
) {
  l.step(`\nStep 1 - Generate Markdown\n`)
  logInitialFunctionCall('generateMarkdown', { options, input })
  const { filename, metadata } = await (async () => {
    switch (true) {
      case !!options.video:
        try {
          l.dim('  Extracting metadata with yt-dlp. Parsing output...')
          const { stdout } = await execFilePromise('yt-dlp', [
            '--restrict-filenames',
            '--print','%(webpage_url)s',
            '--print','%(channel)s',
            '--print','%(uploader_url)s',
            '--print','%(title)s',
            '--print','%(upload_date>%Y-%m-%d)s',
            '--print','%(thumbnail)s',
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

export async function handleGenerateMarkdown(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as GenerateMarkdownBody
  const type = body.type
  const url = body.url
  const filePath = body.filePath
  const options: ProcessingOptions = {}
  if (!['video','file'].includes(type || '')) {
    reply.status(400).send({ error: 'Valid type is required' })
    return
  }
  let input
  if (type === 'video') {
    if (!url) {
      reply.status(400).send({ error: 'URL is required for video' })
      return
    }
    input = url
    options.video = url
  } else {
    if (!filePath) {
      reply.status(400).send({ error: 'File path is required for file' })
      return
    }
    input = filePath
    options.file = filePath
  }
  try {
    const result = await generateMarkdown(options,input)
    reply.send(result)
  } catch (error) {
    reply.status(500).send({ error: (error as Error).message })
  }
}