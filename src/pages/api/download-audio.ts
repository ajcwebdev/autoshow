// src/pages/api/download-audio.ts

import type { APIRoute } from "astro"
import path from "path"
import { fileURLToPath } from "url"
import { fileTypeFromBuffer } from "file-type"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { dbService } from "../../db"
import { execPromise, readFile, access, rename, execFilePromise, env, mkdirSync, existsSync } from "../../utils"
import { T_CONFIG } from '../../types.ts'

export const POST: APIRoute = async ({ request }) => {
  const logPrefix = "[api/download-audio]"
  console.log(`${logPrefix} Starting audio download and processing`)
  
  try {
    const body = await request.json()
    const type = body?.type
    const url = body?.url
    const filePath = body?.filePath
    const options = body?.options || {}
    
    if (!type || !['video', 'file'].includes(type)) {
      return new Response(JSON.stringify({ error: 'Valid type is required' }), { status: 400 })
    }
    
    if (type === 'video' && !url) {
      return new Response(JSON.stringify({ error: 'URL is required for video' }), { status: 400 })
    }
    
    if (type === 'file' && !filePath) {
      return new Response(JSON.stringify({ error: 'File path is required for file' }), { status: 400 })
    }
    
    if (type === 'video') {
      options.video = url
    } else {
      options.file = filePath
    }
    
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const projectRoot = path.resolve(__dirname, '../../../../')
    
    function sanitizeTitle(title: string): string {
      return title
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .toLowerCase()
        .slice(0, 200)
    }
    
    function buildFrontMatter(metadata: {
      showLink: string,
      channel: string,
      channelURL: string,
      title: string,
      description: string,
      publishDate: string,
      coverImage: string
    }): string[] {
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
      console.log(`${logPrefix} Processing video URL: ${url}`)
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
      
      const timestamp = new Date().getTime()
      const uniqueId = `${timestamp}-${Math.floor(Math.random() * 1000)}`
      filename = `${formattedDate}-${sanitizeTitle(videoTitle)}-${uniqueId}`
      
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
      console.log(`${logPrefix} Processing local file: ${filePath}`)
      const originalFilename = filePath.split('/').pop() || ''
      const filenameWithoutExt = originalFilename.replace(/\.[^/.]+$/, '')
      
      const timestamp = new Date().getTime()
      const uniqueId = `${timestamp}-${Math.floor(Math.random() * 1000)}`
      filename = `${sanitizeTitle(filenameWithoutExt)}-${uniqueId}`
      
      metadata = {
        showLink: originalFilename,
        channel: '',
        channelURL: '',
        title: originalFilename,
        description: '',
        publishDate: new Date().toISOString().split('T')[0],
        coverImage: '',
        walletAddress: '',
        mnemonic: ''
      }
    }
    
    const finalPath = `autoshow/content/${filename}`
    const outputPath = `${finalPath}.wav`
    const absoluteOutputPath = path.resolve(projectRoot, outputPath)
    console.log(`${logPrefix} Output path: ${absoluteOutputPath}`)
    
    const contentDir = path.dirname(path.resolve(projectRoot, outputPath))
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
    } catch (error) {
      // File doesn't exist yet, which is fine
    }
    
    async function executeWithRetry(command: string, args: string[]) {
      const maxRetries = 7
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          if (attempt > 1) {
            console.log(`${logPrefix} Retry attempt ${attempt}/${maxRetries}`)
          }
          const { stderr } = await execFilePromise(command, args)
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
      console.log(`${logPrefix} Downloading video from URL`)
      await executeWithRetry('yt-dlp', [
        '--no-warnings',
        '--restrict-filenames',
        '--extract-audio',
        '--audio-format', 'wav',
        '--postprocessor-args', 'ffmpeg:-ar 16000 -ac 1',
        '--no-playlist',
        '-o', absoluteOutputPath,
        url
      ])
      console.log(`${logPrefix} Video download completed`)
    } else if (options.file) {
      console.log(`${logPrefix} Converting local file to WAV`)
      const supportedFormats = new Set([
        'wav', 'mp3', 'm4a', 'aac', 'ogg', 'flac', 'mp4', 'mkv', 'avi', 'mov', 'webm'
      ])
      
      const resolvedFilePath = path.resolve(projectRoot, filePath)
      await access(resolvedFilePath)
      
      const buffer = await readFile(resolvedFilePath)
      const uint8Array = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
      const fileType = await fileTypeFromBuffer(uint8Array)
      
      if (!fileType || !supportedFormats.has(fileType.ext)) {
        const errorMsg = fileType ? `Unsupported file type: ${fileType.ext}` : 'Unable to determine file type'
        throw new Error(errorMsg)
      }
      
      await execPromise(`ffmpeg -i "${resolvedFilePath}" -ar 16000 -ac 1 -c:a pcm_s16le "${absoluteOutputPath}"`, { maxBuffer: 10000 * 1024 })
      console.log(`${logPrefix} File conversion completed`)
    } else {
      throw new Error('Invalid option for audio download/processing.')
    }
    
    if (!existsSync(absoluteOutputPath)) {
      throw new Error(`File was not created at: ${absoluteOutputPath}`)
    }
    
    const region = env['AWS_REGION'] || 'us-east-2'
    const bucket = env['S3_BUCKET_NAME'] || 'autoshow-test'
    const key = path.basename(outputPath)
    
    const fileBuffer = await readFile(absoluteOutputPath)
    const client = new S3Client({ region })
    
    const putCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: 'audio/wav'
    })
    
    await client.send(putCommand)
    console.log(`${logPrefix} File uploaded to S3`)
    
    const getCommand = new GetObjectCommand({ Bucket: bucket, Key: key })
    const s3Url = await getSignedUrl(client, getCommand, { expiresIn: 86400 })
    console.log(`${logPrefix} Generated pre-signed URL with 24-hour expiration: ${s3Url}`)
    
    console.log(`${logPrefix} Creating database entry`)
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
    
    const transcriptionCosts = await computeAllTranscriptCosts(absoluteOutputPath)
    
    return new Response(JSON.stringify({
      id: record.id,
      frontMatter,
      finalPath,
      metadata,
      outputPath: absoluteOutputPath,
      s3Url,
      transcriptionCost: transcriptionCosts
    }), { status: 200 })
  } catch (error) {
    console.error(`${logPrefix} Error:`, error)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    
    return new Response(JSON.stringify({
      error: `An error occurred while processing the audio: ${errorMessage}`,
      stack: error instanceof Error ? error.stack : undefined
    }), { status: 500 })
  }
}

async function getAudioDurationInSeconds(filePath: string): Promise<number> {
  const cmd = `ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`
  const { stdout } = await execPromise(cmd)
  const seconds = parseFloat(stdout.trim())
  
  if (isNaN(seconds)) {
    throw new Error(`Could not parse audio duration for file: ${filePath}`)
  }
  
  return seconds
}

async function computeAllTranscriptCosts(filePath: string): Promise<Record<string, Array<{ modelId: string, cost: number }>>> {
  console.log(`[api/download-audio] Computing transcription costs for ${filePath}`)
  const seconds = await getAudioDurationInSeconds(filePath)
  const minutes = seconds / 60
  
  const result: Record<string, Array<{ modelId: string, cost: number }>> = {}
  
  Object.entries(T_CONFIG).forEach(([serviceName, config]) => {
    result[serviceName] = []
    config.models.forEach(model => {
      const cost = model.costPerMinuteCents * minutes
      const finalCost = parseFloat(cost.toFixed(10))
      result[serviceName].push({ modelId: model.modelId, cost: finalCost })
    })
  })
  
  return result
}