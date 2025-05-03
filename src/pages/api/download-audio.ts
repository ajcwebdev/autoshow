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
  console.log(`${logPrefix} Starting POST request handler`)
  
  try {
    console.log(`${logPrefix} Parsing request body`)
    const body = await request.json()
    const operation = body?.operation || "download"
    console.log(`${logPrefix} Operation type: ${operation}`)
    
    if (operation === "getUrl") {
      console.log(`${logPrefix} Routing to handleGetUrl operation`)
      return await handleGetUrl(body)
    } else if (operation === "calculateCost") {
      console.log(`${logPrefix} Routing to handleCalculateCost operation`)
      return await handleCalculateCost(body)
    } else {
      console.log(`${logPrefix} Routing to handleDownloadAudio operation (default)`)
      return await handleDownloadAudio(body)
    }
  } catch (error) {
    console.error(`${logPrefix} Error processing request:`, error)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    console.error(`${logPrefix} Error details: ${errorMessage}`)
    console.error(`${logPrefix} Error stack:`, error instanceof Error ? error.stack : 'No stack trace available')
    
    return new Response(JSON.stringify({
      error: `An error occurred while processing the audio: ${errorMessage}`,
      stack: error instanceof Error ? error.stack : undefined
    }), { status: 500 })
  }
}

async function handleGetUrl(body: any): Promise<Response> {
  const logPrefix = "[api/download-audio/getUrl]"
  console.log(`${logPrefix} Starting handleGetUrl operation`)
  
  const id = body?.id
  const walletAddress = body?.walletAddress
  console.log(`${logPrefix} Request parameters - ID: ${id}, Wallet Address: ${walletAddress ? walletAddress.substring(0, 6) + '...' : 'undefined'}`)
  
  if (!id || !walletAddress) {
    console.error(`${logPrefix} Missing required parameters: id=${id}, walletAddress=${walletAddress ? 'present' : 'missing'}`)
    return new Response(JSON.stringify({ error: 'id and walletAddress are required' }), { status: 400 })
  }
  
  console.log(`${logPrefix} Fetching show note with ID: ${id}`)
  const showNote = await dbService.getShowNote(id)
  
  if (!showNote) {
    console.error(`${logPrefix} Show note not found with ID: ${id}`)
    return new Response(JSON.stringify({ error: 'Show note not found' }), { status: 404 })
  }
  
  console.log(`${logPrefix} Performing authorization check for wallet address`)
  if (showNote.walletAddress !== walletAddress && walletAddress !== env['ADMIN_WALLET']) {
    console.error(`${logPrefix} Authorization failed - provided wallet does not match note owner or admin wallet`)
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 })
  }
  
  const region = env['AWS_REGION'] || 'us-east-2'
  const bucket = env['S3_BUCKET_NAME'] || 'autoshow-test'
  const key = showNote.title ? `${showNote.title}.wav` : `audio-${id}.wav`
  
  console.log(`${logPrefix} Using S3 configuration - Region: ${region}, Bucket: ${bucket}, Key: ${key}`)
  
  console.log(`${logPrefix} Generating pre-signed URL with 24-hour expiration`)
  const client = new S3Client({ region })
  const command = new GetObjectCommand({ Bucket: bucket, Key: key })
  const url = await getSignedUrl(client, command, { expiresIn: 86400 }) // 24 hours
  
  console.log(`${logPrefix} Generated pre-signed URL with 24-hour expiration:`)
  console.log(`${logPrefix} ${url}`)
  return new Response(JSON.stringify({ url }), { status: 200 })
}

async function handleCalculateCost(body: any): Promise<Response> {
  const logPrefix = "[api/download-audio/calculateCost]"
  console.log(`${logPrefix} Starting cost calculation operation`)
  
  const filePath = body?.filePath
  console.log(`${logPrefix} Requested file path: ${filePath}`)
  
  if (!filePath) {
    console.error(`${logPrefix} Missing required parameter: filePath`)
    return new Response(JSON.stringify({ error: 'filePath is required' }), { status: 400 })
  }
  
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const projectRoot = path.resolve(__dirname, '../../../../')
  console.log(`${logPrefix} Project root directory: ${projectRoot}`)
  
  const isAbsolutePath = path.isAbsolute(filePath)
  console.log(`${logPrefix} Path is absolute: ${isAbsolutePath}`)
  
  let resolvedPath = isAbsolutePath ? filePath : path.resolve(projectRoot, filePath)
  console.log(`${logPrefix} Initial resolved path: ${resolvedPath}`)
  
  const originalPathExists = existsSync(resolvedPath)
  console.log(`${logPrefix} Original path exists: ${originalPathExists}`)
  
  if (!originalPathExists) {
    console.log(`${logPrefix} Original path not found, trying alternative paths`)
    
    const filename = path.basename(filePath)
    console.log(`${logPrefix} Extracted filename: ${filename}`)
    
    const altPath1 = path.resolve(projectRoot, filename)
    console.log(`${logPrefix} Trying alternative path 1: ${altPath1}`)
    
    const altPath1Exists = existsSync(altPath1)
    console.log(`${logPrefix} Alternative path 1 exists: ${altPath1Exists}`)
    
    if (altPath1Exists) {
      console.log(`${logPrefix} Using alternative path 1`)
      resolvedPath = altPath1
    } else {
      const contentDir = path.resolve(projectRoot, 'content')
      const altPath2 = path.resolve(contentDir, filename)
      console.log(`${logPrefix} Trying alternative path 2: ${altPath2}`)
      
      const altPath2Exists = existsSync(altPath2)
      console.log(`${logPrefix} Alternative path 2 exists: ${altPath2Exists}`)
      
      if (altPath2Exists) {
        console.log(`${logPrefix} Using alternative path 2`)
        resolvedPath = altPath2
      }
    }
  }
  
  const finalPathExists = existsSync(resolvedPath)
  console.log(`${logPrefix} Final resolved path exists: ${finalPathExists}`)
  
  if (!finalPathExists) {
    console.error(`${logPrefix} File not found after trying all alternative paths`)
    return new Response(JSON.stringify({
      error: `File not found. Tried: ${resolvedPath}`
    }), { status: 404 })
  }
  
  console.log(`${logPrefix} Computing transcription costs for file: ${resolvedPath}`)
  const transcriptionCosts = await computeAllTranscriptCosts(resolvedPath)
  console.log(`${logPrefix} Transcription costs computed successfully`)
  
  return new Response(JSON.stringify({ transcriptionCost: transcriptionCosts }), { status: 200 })
}

async function handleDownloadAudio(body: any): Promise<Response> {
  const logPrefix = "[api/download-audio/downloadAudio]"
  console.log(`${logPrefix} Starting audio download and processing operation`)
  
  const type = body?.type
  const url = body?.url
  const filePath = body?.filePath
  const options = body?.options || {}
  
  console.log(`${logPrefix} Request parameters - Type: ${type}, URL: ${url || 'N/A'}, FilePath: ${filePath || 'N/A'}`)
  console.log(`${logPrefix} Processing options:`, JSON.stringify(options))
  
  if (!type || !['video', 'file'].includes(type)) {
    console.error(`${logPrefix} Invalid or missing type parameter: ${type}`)
    return new Response(JSON.stringify({ error: 'Valid type is required' }), { status: 400 })
  }
  
  if (type === 'video' && !url) {
    console.error(`${logPrefix} Missing URL parameter for video type`)
    return new Response(JSON.stringify({ error: 'URL is required for video' }), { status: 400 })
  }
  
  if (type === 'file' && !filePath) {
    console.error(`${logPrefix} Missing file path parameter for file type`)
    return new Response(JSON.stringify({ error: 'File path is required for file' }), { status: 400 })
  }
  
  if (type === 'video') {
    console.log(`${logPrefix} Setting video URL in options: ${url}`)
    options.video = url
  } else {
    console.log(`${logPrefix} Setting file path in options: ${filePath}`)
    options.file = filePath
  }
  
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const projectRoot = path.resolve(__dirname, '../../../../')
  console.log(`${logPrefix} Project root directory: ${projectRoot}`)
  
  function sanitizeTitle(title: string): string {
    console.log(`${logPrefix} Sanitizing title: ${title}`)
    const sanitized = title
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase()
      .slice(0, 200)
    console.log(`${logPrefix} Sanitized title: ${sanitized}`)
    return sanitized
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
    console.log(`${logPrefix} Building front matter for metadata`)
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
    
    console.log(`${logPrefix} Parsing yt-dlp output`)
    const [
      showLink = '',
      videoChannel = '',
      uploader_url = '',
      videoTitle = '',
      formattedDate = '',
      thumbnail = ''
    ] = stdout.trim().split('\n')
    
    console.log(`${logPrefix} Video metadata - Title: ${videoTitle}, Channel: ${videoChannel}, Date: ${formattedDate}`)
    
    const timestamp = new Date().getTime()
    const uniqueId = `${timestamp}-${Math.floor(Math.random() * 1000)}`
    console.log(`${logPrefix} Generated unique ID: ${uniqueId}`)
    
    filename = `${formattedDate}-${sanitizeTitle(videoTitle)}-${uniqueId}`
    console.log(`${logPrefix} Generated filename: ${filename}`)
    
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
    console.log(`${logPrefix} Video metadata prepared`)
  } else {
    console.log(`${logPrefix} Processing local file: ${filePath}`)
    const originalFilename = filePath.split('/').pop() || ''
    const filenameWithoutExt = originalFilename.replace(/\.[^/.]+$/, '')
    console.log(`${logPrefix} Original filename without extension: ${filenameWithoutExt}`)
    
    const timestamp = new Date().getTime()
    const uniqueId = `${timestamp}-${Math.floor(Math.random() * 1000)}`
    console.log(`${logPrefix} Generated unique ID: ${uniqueId}`)
    
    filename = `${sanitizeTitle(filenameWithoutExt)}-${uniqueId}`
    console.log(`${logPrefix} Generated filename: ${filename}`)
    
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
    console.log(`${logPrefix} File metadata prepared`)
  }
  
  const finalPath = `autoshow/content/${filename}`
  const outputPath = `${finalPath}.wav`
  const absoluteOutputPath = path.resolve(projectRoot, outputPath)
  
  console.log(`${logPrefix} Final path: ${finalPath}`)
  console.log(`${logPrefix} Output WAV path: ${outputPath}`)
  console.log(`${logPrefix} Absolute output path: ${absoluteOutputPath}`)
  
  const contentDir = path.dirname(path.resolve(projectRoot, outputPath))
  console.log(`${logPrefix} Creating content directory if needed: ${contentDir}`)
  mkdirSync(contentDir, { recursive: true })
  
  console.log(`${logPrefix} Building front matter for metadata`)
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
    console.log(`${logPrefix} Checking if output file already exists: ${outputPath}`)
    await access(outputPath)
    
    console.log(`${logPrefix} Output file already exists, renaming it`)
    const renamedPath = `${finalPath}-renamed.wav`
    console.log(`${logPrefix} Renaming to: ${renamedPath}`)
    await rename(outputPath, renamedPath)
  } catch (error) {
    console.log(`${logPrefix} Output file does not exist yet, proceeding`)
  }
  
  async function executeWithRetry(command: string, args: string[]) {
    const maxRetries = 7
    console.log(`${logPrefix} Executing command with retry: ${command} ${args.join(' ')}`)
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 1) {
          console.log(`${logPrefix} Retry attempt ${attempt}/${maxRetries} for command: ${command}`)
        }
        
        const { stderr } = await execFilePromise(command, args)
        
        if (stderr) {
          console.log(`${logPrefix} Command stderr output: ${stderr}`)
        }
        
        console.log(`${logPrefix} Command executed successfully on attempt ${attempt}`)
        return
      } catch (error) {
        console.error(`${logPrefix} Command error (attempt ${attempt}/${maxRetries}):`, error)
        
        if (attempt === maxRetries) {
          console.error(`${logPrefix} Maximum retry attempts reached, throwing error`)
          throw error
        }
        
        const delayMs = 1000 * 2 ** (attempt - 1)
        console.log(`${logPrefix} Waiting ${delayMs}ms before retry attempt ${attempt + 1}`)
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }
  }
  
  if (options.video) {
    console.log(`${logPrefix} Downloading video from URL: ${url}`)
    
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
    
    console.log(`${logPrefix} Video download and conversion to WAV completed`)
  } else if (options.file) {
    console.log(`${logPrefix} Processing local file`)
    
    const supportedFormats = new Set([
      'wav', 'mp3', 'm4a', 'aac', 'ogg', 'flac', 'mp4', 'mkv', 'avi', 'mov', 'webm'
    ])
    console.log(`${logPrefix} Supported formats: ${[...supportedFormats].join(', ')}`)
    
    const resolvedFilePath = path.resolve(projectRoot, filePath)
    console.log(`${logPrefix} Resolved input file path: ${resolvedFilePath}`)
    
    console.log(`${logPrefix} Checking if input file exists`)
    await access(resolvedFilePath)
    
    console.log(`${logPrefix} Reading file for type detection`)
    const buffer = await readFile(resolvedFilePath)
    const uint8Array = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    
    console.log(`${logPrefix} Detecting file type`)
    const fileType = await fileTypeFromBuffer(uint8Array)
    console.log(`${logPrefix} Detected file type: ${fileType ? fileType.ext : 'unknown'}`)
    
    if (!fileType || !supportedFormats.has(fileType.ext)) {
      const errorMsg = fileType ? `Unsupported file type: ${fileType.ext}` : 'Unable to determine file type'
      console.error(`${logPrefix} ${errorMsg}`)
      throw new Error(errorMsg)
    }
    
    console.log(`${logPrefix} Converting file from ${path.basename(resolvedFilePath)} to WAV format`)
    await execPromise(`ffmpeg -i "${resolvedFilePath}" -ar 16000 -ac 1 -c:a pcm_s16le "${absoluteOutputPath}"`, { maxBuffer: 10000 * 1024 })
    console.log(`${logPrefix} File conversion to WAV completed`)
  } else {
    const errorMsg = 'Invalid option for audio download/processing.'
    console.error(`${logPrefix} ${errorMsg}`)
    throw new Error(errorMsg)
  }
  
  console.log(`${logPrefix} Verifying output file was created: ${absoluteOutputPath}`)
  if (!existsSync(absoluteOutputPath)) {
    const errorMsg = `File was not created at: ${absoluteOutputPath}`
    console.error(`${logPrefix} ${errorMsg}`)
    throw new Error(errorMsg)
  }
  
  const region = env['AWS_REGION'] || 'us-east-2'
  const bucket = env['S3_BUCKET_NAME'] || 'autoshow-test'
  const key = path.basename(outputPath)
  
  console.log(`${logPrefix} Preparing to upload to S3 - Region: ${region}, Bucket: ${bucket}, Key: ${key}`)
  
  const fileBuffer = await readFile(absoluteOutputPath)
  console.log(`${logPrefix} Read file buffer size: ${fileBuffer.length} bytes`)
  
  const client = new S3Client({ region })
  
  console.log(`${logPrefix} Creating PutObjectCommand for upload without ACL`)
  const putCommand = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: fileBuffer,
    ContentType: 'audio/wav'
  })
  
  console.log(`${logPrefix} Uploading file to S3`)
  await client.send(putCommand)
  console.log(`${logPrefix} File uploaded successfully to S3`)
  
  console.log(`${logPrefix} Generating pre-signed URL with 24-hour expiration`)
  const getCommand = new GetObjectCommand({ Bucket: bucket, Key: key })
  const s3Url = await getSignedUrl(client, getCommand, { expiresIn: 86400 }) // 24 hours
  console.log(`${logPrefix} Generated pre-signed URL with 24-hour expiration: ${s3Url}`)
  
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
  
  console.log(`${logPrefix} Show note inserted with ID: ${record.id}`)
  
  console.log(`${logPrefix} Computing transcription costs`)
  const transcriptionCosts = await computeAllTranscriptCosts(absoluteOutputPath)
  
  console.log(`${logPrefix} Preparing successful response with show note ID: ${record.id}`)
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
  const logPrefix = "[api/download-audio:getAudioDurationInSeconds]"
  console.log(`${logPrefix} Getting audio duration for file: ${filePath}`)
  
  if (!existsSync(filePath)) {
    const errorMsg = `File not found: ${filePath}`
    console.error(`${logPrefix} ${errorMsg}`)
    throw new Error(errorMsg)
  }
  
  const cmd = `ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`
  console.log(`${logPrefix} Executing ffprobe command: ${cmd}`)
  
  const { stdout } = await execPromise(cmd)
  console.log(`${logPrefix} ffprobe output: ${stdout.trim()}`)
  
  const seconds = parseFloat(stdout.trim())
  
  if (isNaN(seconds)) {
    const errorMsg = `Could not parse audio duration for file: ${filePath}`
    console.error(`${logPrefix} ${errorMsg}`)
    throw new Error(errorMsg)
  }
  
  console.log(`${logPrefix} Audio duration: ${seconds} seconds`)
  return seconds
}

async function computeAllTranscriptCosts(filePath: string): Promise<Record<string, Array<{ modelId: string, cost: number }>>> {
  const logPrefix = "[api/download-audio:computeAllTranscriptCosts]"
  console.log(`${logPrefix} Computing all transcription costs for file: ${filePath}`)
  
  const seconds = await getAudioDurationInSeconds(filePath)
  const minutes = seconds / 60
  console.log(`${logPrefix} Audio duration: ${seconds} seconds (${minutes.toFixed(2)} minutes)`)
  
  const result: Record<string, Array<{ modelId: string, cost: number }>> = {}
  
  console.log(`${logPrefix} Processing transcription services cost calculations`)
  Object.entries(T_CONFIG).forEach(([serviceName, config]) => {
    console.log(`${logPrefix} Calculating costs for service: ${serviceName}`)
    result[serviceName] = []
    
    config.models.forEach(model => {
      const cost = model.costPerMinuteCents * minutes
      const finalCost = parseFloat(cost.toFixed(10))
      
      console.log(`${logPrefix} Service: ${serviceName}, Model: ${model.modelId}, Cost: ${finalCost} cents`)
      result[serviceName].push({ modelId: model.modelId, cost: finalCost })
    })
  })
  
  console.log(`${logPrefix} Completed cost calculations for all services`)
  return result
}