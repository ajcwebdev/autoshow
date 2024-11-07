// server/routes/video.ts

import { FastifyRequest, FastifyReply } from 'fastify'
import { processVideo } from '../../../src/commands/processVideo.js'
import { reqToOpts } from '../utils/reqToOpts.js'
import { l, err } from '../../../src/globals.js'
import fs from 'fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

// Promisify execFile for async/await usage
const execFilePromise = promisify(execFile)

// Function to sanitize titles for filenames
function sanitizeTitle(title: string): string {
  return title
    .replace(/[^\w\s-]/g, '') // Remove non-word characters except spaces and hyphens
    .trim() // Trim leading and trailing whitespace
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with a single hyphen
    .toLowerCase() // Convert to lowercase
    .slice(0, 200) // Limit length to 200 characters
}

// Handler for the /video route
export const handleVideoRequest = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  l('\nEntered handleVideoRequest')

  try {
    // Access parsed request body
    const requestData = request.body as any
    l('\nParsed request body:', requestData)

    // Extract YouTube URL from the request data
    const { youtubeUrl } = requestData

    if (!youtubeUrl) {
      l('YouTube URL not provided, sending 400')
      reply.status(400).send({ error: 'YouTube URL is required' })
      return
    }

    // Map request data to processing options
    const { options, llmServices, transcriptServices } = reqToOpts(requestData)

    // Set options.video to youtubeUrl
    options.video = youtubeUrl

    l('\nCalling processVideo with params:', {
      youtubeUrl,
      llmServices,
      transcriptServices,
      options,
    })

    // Call processVideo with the mapped options and extracted URL
    await processVideo(options, youtubeUrl, llmServices, transcriptServices)

    // After processing, reconstruct the filename to read the output content
    // Extract metadata using yt-dlp to get video title and upload date
    const { stdout } = await execFilePromise('yt-dlp', [
      '--print', '%(title)s',
      '--print', '%(upload_date>%Y-%m-%d)s',
      youtubeUrl,
    ])

    // Split the output into title and date
    const [videoTitle, formattedDate] = stdout.trim().split('\n')

    // Sanitize the video title to create a safe filename
    const filename = `${formattedDate}-${sanitizeTitle(videoTitle)}`

    // Determine the final path where the markdown file is saved and read the content
    const outputFilePath = `content/${filename}-prompt.md`

    // Read the content asynchronously
    const content = await fs.readFile(outputFilePath, 'utf-8')

    l('\nprocessVideo completed successfully')

    // Send the content back in the response
    reply.send({ content })
  } catch (error) {
    err('Error processing video:', error)
    reply.status(500).send({ error: 'An error occurred while processing the video' })
  }
}