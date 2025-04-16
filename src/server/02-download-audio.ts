// src/server/02-download-audio.ts

import { fileTypeFromBuffer } from 'file-type'
// import { l, err, logInitialFunctionCall } from '../utils/logging.ts'
import { execPromise, readFile, access, rename, execFilePromise, env } from '../utils/node-utils.ts'
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { ProcessingOptions, ShowNoteMetadata } from '../../shared/types.ts'
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { dbService } from '../db.ts'

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

async function generateMarkdown(options: ProcessingOptions, input: string) {
  let filename = ''
  let metadata: ShowNoteMetadata = {showLink:'',channel:'',channelURL:'',title:'',description:'',publishDate:'',coverImage:'',walletAddress:'',mnemonic:''}
  if (options.video) {
    const { stdout } = await execFilePromise('yt-dlp',[
      '--restrict-filenames',
      '--print','%(webpage_url)s',
      '--print','%(channel)s',
      '--print','%(uploader_url)s',
      '--print','%(title)s',
      '--print','%(upload_date>%Y-%m-%d)s',
      '--print','%(thumbnail)s',
      input
    ])
    const [
      showLink='',
      videoChannel='',
      uploader_url='',
      videoTitle='',
      formattedDate='',
      thumbnail=''
    ] = stdout.trim().split('\n')
    filename = `${formattedDate}-${sanitizeTitle(videoTitle)}`
    metadata = {
      showLink:showLink,
      channel:videoChannel,
      channelURL:uploader_url,
      title:videoTitle,
      description:'',
      publishDate:formattedDate,
      coverImage:thumbnail,
      walletAddress:'',
      mnemonic:''
    }
  } else if (options.file) {
    const originalFilename = input.split('/').pop()||''
    const filenameWithoutExt = originalFilename.replace(/\.[^/.]+$/,'')
    filename = sanitizeTitle(filenameWithoutExt)
    metadata = {
      showLink:originalFilename,
      channel:'',
      channelURL:'',
      title:originalFilename,
      description:'',
      publishDate:'',
      coverImage:'',
      walletAddress:'',
      mnemonic:''
    }
  } else {
    throw new Error('Invalid option for markdown generation.')
  }
  const finalPath = `content/${filename}`
  const frontMatter = buildFrontMatter({
    showLink: metadata.showLink||'',
    channel: metadata.channel||'',
    channelURL: metadata.channelURL||'',
    title: metadata.title,
    description: metadata.description||'',
    publishDate: metadata.publishDate||'',
    coverImage: metadata.coverImage||''
  })
  return {frontMatter: frontMatter.join('\n'),finalPath,filename,metadata}
}

async function uploadFileToS3(localFilePath: string) {
  const region = env['AWS_REGION'] || 'us-east-2'
  const bucket = env['S3_BUCKET_NAME'] || 'autoshow-test'
  const key = localFilePath.split('/').pop()||''
  const fileBuffer = await readFile(localFilePath)
  const client = new S3Client({ region })
  const command = new PutObjectCommand({ Bucket: bucket, Key: key })
  const signedUrl = await getSignedUrl(client, command, { expiresIn: 3600 })
  await fetch(signedUrl,{
    method:'PUT',
    body:fileBuffer,
    headers:{
      'Content-Type':'audio/wav',
      'Content-Length': fileBuffer.length.toString()
    }
  })
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`
}

async function executeWithRetry(command: string,args: string[]) {
  const maxRetries = 7
  for (let attempt=1;attempt<=maxRetries;attempt++) {
    try {
      const { stderr } = await execFilePromise(command,args)
      if (stderr) {}
      return
    } catch(error) {
      if (attempt===maxRetries) {
        throw error
      }
      const delayMs = 1000*2**(attempt-1)
      await new Promise((resolve)=>setTimeout(resolve,delayMs))
    }
  }
}

async function downloadAudio(options: ProcessingOptions,input: string,filename: string) {
  const finalPath = `content/${filename}`
  const outputPath = `${finalPath}.wav`
  try {
    await access(outputPath)
    const renamedPath = `${finalPath}-renamed.wav`
    await rename(outputPath,renamedPath)
  } catch{}
  if (options.video) {
    await executeWithRetry('yt-dlp',[
      '--no-warnings',
      '--restrict-filenames',
      '--extract-audio',
      '--audio-format','wav',
      '--postprocessor-args','ffmpeg:-ar 16000 -ac 1',
      '--no-playlist',
      '-o',outputPath,
      input
    ])
  } else if (options.file) {
    const supportedFormats = new Set([
      'wav','mp3','m4a','aac','ogg','flac','mp4','mkv','avi','mov','webm'
    ])
    await access(input)
    const buffer = await readFile(input)
    const fileType = await fileTypeFromBuffer(buffer)
    if(!fileType||!supportedFormats.has(fileType.ext)) {
      throw new Error(fileType?`Unsupported file type: ${fileType.ext}`:'Unable to determine file type')
    }
    await execPromise(`ffmpeg -i "${input}" -ar 16000 -ac 1 -c:a pcm_s16le "${outputPath}"`,{maxBuffer:10000*1024})
  } else {
    throw new Error('Invalid option for audio download/processing.')
  }
  const s3Url = await uploadFileToS3(outputPath)
  return { outputPath, s3Url }
}

export async function handleDownloadAudio(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as {type?:string, url?:string, filePath?:string, options?:ProcessingOptions}
  const type = body.type
  if(!type||!['video','file'].includes(type)) {
    reply.status(400).send({error:'Valid type is required'})
    return
  }
  const url = body.url
  const filePath = body.filePath
  if(type==='video'&&!url) {
    reply.status(400).send({error:'URL is required for video'})
    return
  }
  if(type==='file'&&!filePath) {
    reply.status(400).send({error:'File path is required for file'})
    return
  }
  const options: ProcessingOptions = body.options||{}
  if(type==='video') options.video=url as string
  else options.file=filePath as string
  try {
    const {frontMatter,finalPath,filename,metadata} = await generateMarkdown(options,type==='video'?url as string:filePath as string)
    const { outputPath, s3Url } = await downloadAudio(options,type==='video'?url as string:filePath as string,filename)

    // Example: Insert show note record to get an ID (this is just a minimal record).
    // If your DB has required fields, fill them in.
    // We use 'walletAddress' from your options if present.
    const record = await dbService.insertShowNote({
      title: metadata.title,
      publishDate: metadata.publishDate,
      frontmatter: frontMatter,
      walletAddress: options['walletAddress']||'',
      llmOutput: '',
      transcript: '',
      showLink: metadata.showLink||'',
      channel: metadata.channel||'',
      channelURL: metadata.channelURL||'',
      description: metadata.description||'',
      coverImage: metadata.coverImage||'',
    })

    reply.send({
      id: record.id,
      frontMatter,
      finalPath,
      metadata,
      outputPath,
      s3Url
    })
  } catch(e) {
    reply.status(500).send({error:(e as Error).message})
  }
}

export async function handleGetAudioUrl(request: FastifyRequest, reply: FastifyReply) {
  const { id, walletAddress } = request.body as { id?: number, walletAddress?: string }
  if (!id || !walletAddress) {
    reply.status(400).send({ error: 'id and walletAddress are required' })
    return
  }
  const showNote = await dbService.getShowNote(id)
  if (!showNote) {
    reply.status(404).send({ error: 'Show note not found' })
    return
  }
  if (showNote.walletAddress !== walletAddress && walletAddress!==env['ADMIN_WALLET']) {
    reply.status(403).send({ error: 'Unauthorized' })
    return
  }
  const region = env['AWS_REGION'] || 'us-east-2'
  const bucket = env['S3_BUCKET_NAME'] || 'autoshow-test'
  const key = `${showNote.title}.wav`
  const client = new S3Client({ region })
  const command = new GetObjectCommand({ Bucket: bucket, Key: key })
  const url = await getSignedUrl(client, command, { expiresIn: 3600 })
  reply.send({ url })
}