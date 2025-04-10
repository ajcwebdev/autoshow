// src/server/02-download-audio.ts

import { fileTypeFromBuffer } from 'file-type'
import { l, err, logInitialFunctionCall } from '../utils/logging.ts'
import { execPromise, readFile, access, rename, execFilePromise } from '../utils/node-utils.ts'
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { ProcessingOptions, ShowNoteMetadata } from '../../shared/types.ts'

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
  logInitialFunctionCall('generateMarkdown',{options,input})
  let filename = ''
  let metadata: ShowNoteMetadata = {showLink:'',channel:'',channelURL:'',title:'',description:'',publishDate:'',coverImage:'',walletAddress:'',mnemonic:''}
  if (options.video) {
    try {
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
    } catch(e) {
      err(`Error extracting metadata for ${input}: ${e instanceof Error ? e.message : String(e)}`)
      throw e
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
    throw new Error('Invalid option provided for markdown generation.')
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
  l.step('\nStep 2 - Download Audio\n')
  logInitialFunctionCall('downloadAudio',{options,input,filename})
  const finalPath = `content/${filename}`
  const outputPath = `${finalPath}.wav`
  try {
    await access(outputPath)
    const renamedPath = `${finalPath}-renamed.wav`
    await rename(outputPath,renamedPath)
  } catch{}
  if (options.video) {
    try {
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
    } catch(e) {
      err(`Error downloading audio: ${e instanceof Error?e.message:String(e)}`)
      throw e
    }
  } else if (options.file) {
    const supportedFormats = new Set([
      'wav','mp3','m4a','aac','ogg','flac','mp4','mkv','avi','mov','webm'
    ])
    try {
      await access(input)
      const buffer = await readFile(input)
      const fileType = await fileTypeFromBuffer(buffer)
      if(!fileType||!supportedFormats.has(fileType.ext)) {
        throw new Error(fileType?`Unsupported file type: ${fileType.ext}`:'Unable to determine file type')
      }
      await execPromise(`ffmpeg -i "${input}" -ar 16000 -ac 1 -c:a pcm_s16le "${outputPath}"`,{maxBuffer:10000*1024})
    } catch(e) {
      err(`Error processing local file: ${e instanceof Error?e.message:String(e)}`)
      throw e
    }
  } else {
    throw new Error('Invalid option provided for audio download/processing.')
  }
  return outputPath
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
  if(type==='video') options.video=url
  else options.file=filePath
  try {
    const input = type==='video'?url as string:filePath as string
    const {frontMatter,finalPath,filename,metadata} = await generateMarkdown(options,input)
    const outputPath = await downloadAudio(options,input,filename)
    reply.send({frontMatter,finalPath,metadata,outputPath})
  } catch(e) {
    reply.status(500).send({error:(e as Error).message})
  }
}