// src/pages/api/download-audio.ts

import type { APIRoute } from "astro"
import path from "path"
import { fileURLToPath } from "url"
import { fileTypeFromBuffer } from "file-type"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { dbService } from "../../db"
import { execPromise, readFile, access, rename, execFilePromise, env, mkdirSync, existsSync } from "../../utils"

export const POST: APIRoute = async ({ request }) => {
  console.log("[api/download-audio] POST request started")
  
  try {
    const body = await request.json()
    console.log(`[api/download-audio] Raw request body:`, JSON.stringify(body, null, 2))
    
    const type = body?.type
    const url = body?.url
    const filePath = body?.filePath
    const options = body?.options || {}
    
    console.log(`[api/download-audio] type: ${type}`)
    console.log(`[api/download-audio] url: ${url}`)
    console.log(`[api/download-audio] filePath: ${filePath}`)
    console.log(`[api/download-audio] options:`, JSON.stringify(options, null, 2))
    
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
    
    if (type === 'video') {
      console.log(`[api/download-audio] Setting video URL: ${url}`)
      options.video = url
    } else {
      console.log(`[api/download-audio] Setting file path: ${filePath}`)
      options.file = filePath
    }
    
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const projectRoot = path.resolve(__dirname, '../../../../')
    
    console.log(`[api/download-audio] Project root directory: ${projectRoot}`)
    
    function sanitizeTitle(title: string): string {
      console.log(`[api/download-audio] Sanitizing title: "${title}"`)
      const sanitized = title
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .toLowerCase()
        .slice(0, 200)
      console.log(`[api/download-audio] Sanitized title: "${sanitized}"`)
      return sanitized
    }
    
    function buildFrontMatter(metadata: { showLink: string, channel: string, channelURL: string, title: string, description: string, publishDate: string, coverImage: string }): string[] {
      console.log(`[api/download-audio] Building front matter for title: "${metadata.title}"`)
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
      console.log(`[api/download-audio] Fetching video metadata with yt-dlp...`)
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
      
      console.log(`[api/download-audio] Video metadata:`)
      console.log(`  Title: ${videoTitle}`)
      console.log(`  Channel: ${videoChannel}`)
      console.log(`  Date: ${formattedDate}`)
      
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
      console.log(`[api/download-audio] Processing local file metadata...`)
      const originalFilename = filePath.split('/').pop() || ''
      const filenameWithoutExt = originalFilename.replace(/\.[^/.]+$/, '')
      
      console.log(`[api/download-audio] Original filename: ${originalFilename}`)
      console.log(`[api/download-audio] Filename without extension: ${filenameWithoutExt}`)
      
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
    
    console.log(`[api/download-audio] Final filename: ${filename}`)
    console.log(`[api/download-audio] Output path: ${outputPath}`)
    console.log(`[api/download-audio] Absolute output path: ${absoluteOutputPath}`)
    
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
      console.log(`[api/download-audio] Checking if file already exists...`)
      await access(outputPath)
      
      const renamedPath = `${finalPath}-renamed.wav`
      console.log(`[api/download-audio] File exists, renaming to: ${renamedPath}`)
      await rename(outputPath, renamedPath)
    } catch (error) {
      console.log(`[api/download-audio] File doesn't exist yet or error renaming:`, error)
    }
    
    async function executeWithRetry(command: string, args: string[]) {
      const maxRetries = 7
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[api/download-audio] Executing command (attempt ${attempt}): ${command} ${args.join(' ')}`)
          const { stderr } = await execFilePromise(command, args)
          
          if (stderr) {
            console.log(`[api/download-audio] Command stderr: ${stderr}`)
          }
          
          console.log(`[api/download-audio] Command executed successfully`)
          return
        } catch (error) {
          console.error(`[api/download-audio] Command error (attempt ${attempt}):`, error)
          
          if (attempt === maxRetries) {
            throw error
          }
          
          const delayMs = 1000 * 2 ** (attempt - 1)
          console.log(`[api/download-audio] Retrying in ${delayMs / 1000} seconds...`)
          await new Promise((resolve) => setTimeout(resolve, delayMs))
        }
      }
    }
    
    if (options.video) {
      console.log(`[api/download-audio] Downloading and converting video to audio...`)
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
      
      console.log(`[api/download-audio] Checking file exists at: ${resolvedFilePath}`)
      await access(resolvedFilePath)
      
      console.log(`[api/download-audio] Reading file for type detection...`)
      const buffer = await readFile(resolvedFilePath)
      const uint8Array = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
      const fileType = await fileTypeFromBuffer(uint8Array)
      
      if (!fileType || !supportedFormats.has(fileType.ext)) {
        console.error(`[api/download-audio] Unsupported file type: ${fileType?.ext || 'unknown'}`)
        throw new Error(fileType ? `Unsupported file type: ${fileType.ext}` : 'Unable to determine file type')
      }
      
      console.log(`[api/download-audio] File type detected: ${fileType.ext}`)
      console.log(`[api/download-audio] Converting file from ${resolvedFilePath} to ${absoluteOutputPath}`)
      
      await execPromise(`ffmpeg -i "${resolvedFilePath}" -ar 16000 -ac 1 -c:a pcm_s16le "${absoluteOutputPath}"`, { maxBuffer: 10000 * 1024 })
    } else {
      console.error('[api/download-audio] Invalid option for audio download/processing.')
      throw new Error('Invalid option for audio download/processing.')
    }
    
    if (existsSync(absoluteOutputPath)) {
      console.log(`[api/download-audio] File successfully created at: ${absoluteOutputPath}`)
    } else {
      console.error(`[api/download-audio] File was NOT created at: ${absoluteOutputPath}`)
    }
    
    const region = env['AWS_REGION'] || 'us-east-2'
    const bucket = env['S3_BUCKET_NAME'] || 'autoshow-test'
    const key = outputPath.split('/').pop() || ''
    
    console.log(`[api/download-audio] Uploading to S3: region=${region}, bucket=${bucket}, key=${key}`)
    
    const fileBuffer = await readFile(absoluteOutputPath)
    const client = new S3Client({ region })
    const command = new PutObjectCommand({ Bucket: bucket, Key: key })
    const signedUrl = await getSignedUrl(client, command, { expiresIn: 3600 })
    
    console.log(`[api/download-audio] Generated signed URL, uploading file...`)
    
    await fetch(signedUrl, {
      method: 'PUT',
      body: fileBuffer,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': fileBuffer.length.toString()
      }
    })
    
    const s3Url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`
    console.log(`[api/download-audio] File uploaded to S3: ${s3Url}`)
    
    console.log(`[api/download-audio] Inserting show note into database...`)
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
    console.log(`[api/download-audio] Created record with ID: ${record.id}`)
    
    return new Response(JSON.stringify({
      id: record.id,
      frontMatter,
      finalPath,
      metadata,
      outputPath: absoluteOutputPath,
      s3Url
    }), { status: 200 })
  } catch (error) {
    console.error(`[api/download-audio] Caught error:`, error)
    console.error(`[api/download-audio] Error stack:`, error instanceof Error ? error.stack : 'No stack trace')
    
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return new Response(JSON.stringify({ 
      error: `An error occurred while processing the audio: ${errorMessage}`,
      stack: error instanceof Error ? error.stack : undefined
    }), { status: 500 })
  }
}