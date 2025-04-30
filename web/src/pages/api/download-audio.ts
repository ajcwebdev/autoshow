// web/src/pages/api/download-audio.ts

import type { APIRoute } from "astro"
import path from "path"
import { fileURLToPath } from "url"
import { fileTypeFromBuffer } from "file-type"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { dbService } from "../../../../src/db.ts"
import { execPromise, readFile, access, rename, execFilePromise, env, mkdirSync } from "../../../../src/utils.ts"

export const POST: APIRoute = async ({ request }) => {
  console.log("[api/download-audio] POST request started")
  try {
    const body = await request.json()
    console.log(`[api/download-audio] Raw request body: ${JSON.stringify(body, null, 2)}`)
    
    const type = body?.type
    const url = body?.url
    const filePath = body?.filePath
    const options = body?.options || {}
    
    console.log(`[api/download-audio] type: ${type}`)
    
    if (!type || !['video', 'file'].includes(type)) {
      console.error("[api/download-audio] Invalid type")
      return new Response(JSON.stringify({ error: 'Valid type is required' }), { status: 400 })
    }
    
    if (type === 'video' && !url) {
      console.error("[api/download-audio] URL is required for video")
      return new Response(JSON.stringify({ error: 'URL is required for video' }), { status: 400 })
    }
    
    if (type === 'file' && !filePath) {
      console.error("[api/download-audio] File path is required for file")
      return new Response(JSON.stringify({ error: 'File path is required for file' }), { status: 400 })
    }
    
    if (type === 'video') options.video = url
    else options.file = filePath
    
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const projectRoot = path.resolve(__dirname, '../../../../')
    
    function sanitizeTitle(title: string) {
      return title
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .toLowerCase()
        .slice(0, 200)
    }
    
    function buildFrontMatter(metadata: { showLink: string, channel: string, channelURL: string, title: string, description: string, publishDate: string, coverImage: string }) {
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
    
    let filename = ''
    let metadata = {
      showLink: '',
      channel: '',
      channelURL: '',
      title: '',
      description: '',
      publishDate: '',
      coverImage: '',
      walletAddress: '',
      mnemonic: ''
    }
    
    if (options.video) {
      const { stdout } = await execFilePromise('yt-dlp', [
        '--restrict-filenames',
        '--print', '%(webpage_url)s',
        '--print', '%(channel)s',
        '--print', '%(uploader_url)s',
        '--print', '%(title)s',
        '--print', '%(upload_date>%Y-%m-%d)s',
        '--print', '%(thumbnail)s',
        url
      ])
      
      const [
        showLink = '',
        videoChannel = '',
        uploader_url = '',
        videoTitle = '',
        formattedDate = '',
        thumbnail = ''
      ] = stdout.trim().split('\n')
      
      filename = `${formattedDate}-${sanitizeTitle(videoTitle)}`
      metadata = {
        showLink,
        channel: videoChannel,
        channelURL: uploader_url,
        title: videoTitle,
        description: '',
        publishDate: formattedDate,
        coverImage: thumbnail,
        walletAddress: '',
        mnemonic: ''
      }
    } else {
      const originalFilename = filePath.split('/').pop() || ''
      const filenameWithoutExt = originalFilename.replace(/\.[^/.]+$/, '')
      filename = sanitizeTitle(filenameWithoutExt)
      metadata = {
        showLink: originalFilename,
        channel: '',
        channelURL: '',
        title: originalFilename,
        description: '',
        publishDate: '',
        coverImage: '',
        walletAddress: '',
        mnemonic: ''
      }
    }
    
    const finalPath = `content/${filename}`
    const outputPath = `${finalPath}.wav`
    
    // Ensure the content directory exists
    const contentDir = path.dirname(path.resolve(projectRoot, outputPath))
    console.log(`[api/download-audio] Ensuring directory exists: ${contentDir}`)
    mkdirSync(contentDir, { recursive: true })
    
    const frontMatter = buildFrontMatter({
      showLink: metadata.showLink || '',
      channel: metadata.channel || '',
      channelURL: metadata.channelURL || '',
      title: metadata.title,
      description: metadata.description || '',
      publishDate: metadata.publishDate || '',
      coverImage: metadata.coverImage || ''
    }).join('\n')
    
    try {
      await access(outputPath)
      const renamedPath = `${finalPath}-renamed.wav`
      await rename(outputPath, renamedPath)
    } catch { }
    
    async function executeWithRetry(command: string, args: string[]) {
      const maxRetries = 7
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const { stderr } = await execFilePromise(command, args)
          if (stderr) { }
          return
        } catch (error) {
          if (attempt === maxRetries) {
            throw error
          }
          const delayMs = 1000 * 2 ** (attempt - 1)
          await new Promise((resolve) => setTimeout(resolve, delayMs))
        }
      }
    }
    
    if (options.video) {
      await executeWithRetry('yt-dlp', [
        '--no-warnings',
        '--restrict-filenames',
        '--extract-audio',
        '--audio-format', 'wav',
        '--postprocessor-args', 'ffmpeg:-ar 16000 -ac 1',
        '--no-playlist',
        '-o', outputPath,
        url
      ])
    } else if (options.file) {
      const supportedFormats = new Set([
        'wav', 'mp3', 'm4a', 'aac', 'ogg', 'flac', 'mp4', 'mkv', 'avi', 'mov', 'webm'
      ])
      
      const resolvedFilePath = path.resolve(projectRoot, filePath)
      await access(resolvedFilePath)
      const buffer = await readFile(resolvedFilePath)
      // Convert Node.js Buffer to Uint8Array
      const uint8Array = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      const fileType = await fileTypeFromBuffer(uint8Array)
      
      if (!fileType || !supportedFormats.has(fileType.ext)) {
        throw new Error(fileType ? `Unsupported file type: ${fileType.ext}` : 'Unable to determine file type')
      }
      
      await execPromise(`ffmpeg -i "${resolvedFilePath}" -ar 16000 -ac 1 -c:a pcm_s16le "${outputPath}"`, { maxBuffer: 10000 * 1024 })
    } else {
      throw new Error('Invalid option for audio download/processing.')
    }
    
    const region = env['AWS_REGION'] || 'us-east-2'
    const bucket = env['S3_BUCKET_NAME'] || 'autoshow-test'
    const key = outputPath.split('/').pop() || ''
    const fileBuffer = await readFile(outputPath)
    const client = new S3Client({ region })
    const command = new PutObjectCommand({ Bucket: bucket, Key: key })
    const signedUrl = await getSignedUrl(client, command, { expiresIn: 3600 })
    
    await fetch(signedUrl, {
      method: 'PUT',
      body: fileBuffer,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': fileBuffer.length.toString()
      }
    })
    
    const s3Url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`
    
    const record = await dbService.insertShowNote({
      title: metadata.title,
      publishDate: metadata.publishDate,
      frontmatter: frontMatter,
      walletAddress: options['walletAddress'] || '',
      llmOutput: '',
      transcript: '',
      showLink: metadata.showLink || '',
      channel: metadata.channel || '',
      channelURL: metadata.channelURL || '',
      description: metadata.description || '',
      coverImage: metadata.coverImage || '',
    })
    
    console.log("[api/download-audio] Successfully processed audio")
    return new Response(JSON.stringify({
      id: record.id,
      frontMatter,
      finalPath,
      metadata,
      outputPath,
      s3Url
    }), { status: 200 })
  } catch (error) {
    console.error(`[api/download-audio] Caught error: ${error}`)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return new Response(JSON.stringify({ error: `An error occurred while processing the audio: ${errorMessage}` }), { status: 500 })
  }
}