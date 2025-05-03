// src/pages/api/download-audio.ts

import type { APIRoute } from "astro"
import path from "path"
import { fileURLToPath } from "url"
import { fileTypeFromBuffer } from "file-type"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { dbService } from "../../db"
import { execPromise, readFile, access, rename, execFilePromise, env, mkdirSync, existsSync, readdir } from "../../utils"
import { T_CONFIG } from '../../types.ts'

export const POST: APIRoute = async ({ request }) => {
  const logPrefix = "[api/download-audio]"
  try {
    const body = await request.json()
    const operation = body?.operation || "download"
    
    if (operation === "getUrl") {
      return await handleGetUrl(body)
    } else if (operation === "calculateCost") {
      return await handleCalculateCost(body)
    } else {
      return await handleDownloadAudio(body)
    }
  } catch (error) {
    console.error(`${logPrefix} Error processing request:`, error)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return new Response(JSON.stringify({
      error: `An error occurred while processing the audio: ${errorMessage}`,
      stack: error instanceof Error ? error.stack : undefined
    }), { status: 500 })
  }
}

async function handleGetUrl(body: any): Promise<Response> {
  const logPrefix = "[api/download-audio/getUrl]"
  const id = body?.id
  const walletAddress = body?.walletAddress
  
  if (!id || !walletAddress) {
    return new Response(JSON.stringify({ error: 'id and walletAddress are required' }), { status: 400 })
  }
  
  const showNote = await dbService.getShowNote(id)
  if (!showNote) {
    return new Response(JSON.stringify({ error: 'Show note not found' }), { status: 404 })
  }
  
  if (showNote.walletAddress !== walletAddress && walletAddress !== env['ADMIN_WALLET']) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 })
  }
  
  const region = env['AWS_REGION'] || 'us-east-2'
  const bucket = env['S3_BUCKET_NAME'] || 'autoshow-test'
  const key = `${showNote.title}.wav`
  
  const client = new S3Client({ region })
  const command = new GetObjectCommand({ Bucket: bucket, Key: key })
  const url = await getSignedUrl(client, command, { expiresIn: 3600 })
  
  return new Response(JSON.stringify({ url }), { status: 200 })
}

async function handleCalculateCost(body: any): Promise<Response> {
  const logPrefix = "[api/download-audio/calculateCost]"
  const filePath = body?.filePath
  
  if (!filePath) {
    return new Response(JSON.stringify({ error: 'filePath is required' }), { status: 400 })
  }
  
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const projectRoot = path.resolve(__dirname, '../../../../')
  
  const isAbsolutePath = path.isAbsolute(filePath)
  let resolvedPath = isAbsolutePath ? filePath : path.resolve(projectRoot, filePath)
  
  const originalPathExists = existsSync(resolvedPath)
  if (!originalPathExists) {
    const filename = path.basename(filePath)
    const altPath1 = path.resolve(projectRoot, filename)
    const altPath1Exists = existsSync(altPath1)
    
    if (altPath1Exists) {
      resolvedPath = altPath1
    } else {
      const contentDir = path.resolve(projectRoot, 'content')
      const altPath2 = path.resolve(contentDir, filename)
      const altPath2Exists = existsSync(altPath2)
      
      if (altPath2Exists) {
        resolvedPath = altPath2
      }
    }
  }
  
  const finalPathExists = existsSync(resolvedPath)
  if (!finalPathExists) {
    return new Response(JSON.stringify({
      error: `File not found. Tried: ${resolvedPath}`
    }), { status: 404 })
  }
  
  const transcriptionCosts = await computeAllTranscriptCosts(resolvedPath)
  return new Response(JSON.stringify({ transcriptionCost: transcriptionCosts }), { status: 200 })
}

async function handleDownloadAudio(body: any): Promise<Response> {
  const logPrefix = "[api/download-audio/downloadAudio]"
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
    console.log(`${logPrefix} Fetching video metadata for URL: ${url}`)
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
  
  const finalPath = `autoshow/content/${filename}`
  const outputPath = `${finalPath}.wav`
  const absoluteOutputPath = path.resolve(projectRoot, outputPath)
  
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
    // File doesn't exist yet or error renaming - this is expected in most cases
  }
  
  async function executeWithRetry(command: string, args: string[]) {
    const maxRetries = 7
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 1) {
          console.log(`${logPrefix} Retry attempt ${attempt} for command: ${command}`)
        }
        const { stderr } = await execFilePromise(command, args)
        if (stderr) {
          console.log(`${logPrefix} Command stderr: ${stderr}`)
        }
        return
      } catch (error) {
        console.error(`${logPrefix} Command error (attempt ${attempt}):`, error)
        if (attempt === maxRetries) {
          throw error
        }
        const delayMs = 1000 * 2 ** (attempt - 1)
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }
  }
  
  if (options.video) {
    console.log(`${logPrefix} Downloading video from: ${url}`)
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
  } else if (options.file) {
    const supportedFormats = new Set([
      'wav', 'mp3', 'm4a', 'aac', 'ogg', 'flac', 'mp4', 'mkv', 'avi', 'mov', 'webm'
    ])
    
    const resolvedFilePath = path.resolve(projectRoot, filePath)
    await access(resolvedFilePath)
    
    const buffer = await readFile(resolvedFilePath)
    const uint8Array = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    const fileType = await fileTypeFromBuffer(uint8Array)
    
    if (!fileType || !supportedFormats.has(fileType.ext)) {
      throw new Error(fileType ? `Unsupported file type: ${fileType.ext}` : 'Unable to determine file type')
    }
    
    console.log(`${logPrefix} Converting file from ${path.basename(resolvedFilePath)} to WAV format`)
    await execPromise(`ffmpeg -i "${resolvedFilePath}" -ar 16000 -ac 1 -c:a pcm_s16le "${absoluteOutputPath}"`, { maxBuffer: 10000 * 1024 })
  } else {
    throw new Error('Invalid option for audio download/processing.')
  }
  
  if (!existsSync(absoluteOutputPath)) {
    throw new Error(`File was not created at: ${absoluteOutputPath}`)
  }
  
  const region = env['AWS_REGION'] || 'us-east-2'
  const bucket = env['S3_BUCKET_NAME'] || 'autoshow-test'
  const key = outputPath.split('/').pop() || ''
  
  console.log(`${logPrefix} Uploading to S3: ${key}`)
  const fileBuffer = await readFile(absoluteOutputPath)
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
  
  console.log(`${logPrefix} Inserting show note into database for: ${metadata.title}`)
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
}

async function getAudioDurationInSeconds(filePath: string): Promise<number> {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`)
  }
  
  const cmd = `ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`
  const { stdout } = await execPromise(cmd)
  const seconds = parseFloat(stdout.trim())
  
  if (isNaN(seconds)) {
    throw new Error(`Could not parse audio duration for file: ${filePath}`)
  }
  
  return seconds
}

async function computeAllTranscriptCosts(filePath: string): Promise<Record<string, Array<{ modelId: string, cost: number }>>> {
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