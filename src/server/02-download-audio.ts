// src/server/download-audio.ts

import { fileTypeFromBuffer } from 'file-type'
import { l, err, logInitialFunctionCall } from '../utils/logging.ts'
import { execPromise, readFile, access, rename, execFilePromise, unlink } from '../utils/node-utils.ts'
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { ProcessingOptions } from '../../shared/types.ts'

export async function saveAudio(id: string, ensureFolders?: boolean) {
  if (ensureFolders) {
    l.dim('\nSkipping cleanup to preserve or ensure metadata directories.\n')
    return
  }

  const extensions = ['.wav']
  l.dim(`  Temporary files deleted:`)

  for (const ext of extensions) {
    try {
      await unlink(`${id}${ext}`)
      l.dim(`    - ${id}${ext}`)
    } catch (error) {
      if (error instanceof Error && (error as Error).message !== 'ENOENT') {
        err(`Error deleting file ${id}${ext}: ${(error as Error).message}`)
      }
    }
  }
}

export async function executeWithRetry(
  command: string,
  args: string[],
) {
  const maxRetries = 7

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Attempt to execute the command
      const { stderr } = await execFilePromise(command, args)
      // Log any warnings from yt-dlp
      if (stderr) {
        err(`yt-dlp warnings: ${stderr}`)
      }
      return
    } catch (error) {
      // If the last attempt fails, throw the error
      if (attempt === maxRetries) {
        err(`Failed after ${maxRetries} attempts`)
        throw error
      }

      // Exponential backoff: Wait before trying again
      const delayMs = 1000 * 2 ** (attempt - 1)
      l.dim(
        `Retry ${attempt} of ${maxRetries} failed. Waiting ${delayMs} ms before next attempt...`
      )
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
}

export async function downloadAudio(
  options: ProcessingOptions,
  input: string,
  filename: string
) {
  l.step(`\nStep 2 - Download Audio\n`)
  logInitialFunctionCall('downloadAudio', { options, input, filename })

  const finalPath = `content/${filename}`
  const outputPath = `${finalPath}.wav`

  // Edge case fix: If a WAV file already exists with the same name, rename it to avoid a hang during conversion
  try {
    await access(outputPath)
    const renamedPath = `${finalPath}-renamed.wav`
    await rename(outputPath, renamedPath)
    l.dim(`    - Existing file found at ${outputPath}. Renamed to ${renamedPath}`)
  } catch {
    // If we reach here, the file doesn't exist. Proceed as normal.
  }

  if (options.video) {
    try {
      await executeWithRetry(
        'yt-dlp',
        [
          '--no-warnings',
          '--restrict-filenames',
          '--extract-audio',
          '--audio-format', 'wav',
          '--postprocessor-args', 'ffmpeg:-ar 16000 -ac 1',
          '--no-playlist',
          '-o', outputPath,
          input,
        ]
      )
    } catch (error) {
      err(`Error downloading audio: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  } else if (options.file) {
    const supportedFormats = new Set([
      'wav', 'mp3', 'm4a', 'aac', 'ogg', 'flac', 'mp4', 'mkv', 'avi', 'mov', 'webm',
    ])
    try {
      await access(input)
      l.dim(`\n  File ${input} is accessible. Attempting to read file data for type detection...\n`)
      const buffer = await readFile(input)
      l.dim(`    - Successfully read file: ${buffer.length} bytes`)
      const fileType = await fileTypeFromBuffer(buffer)
      l.dim(`    - File type detection result: ${fileType?.ext ?? 'unknown'}`)
      if (!fileType || !supportedFormats.has(fileType.ext)) {
        throw new Error(
          fileType ? `Unsupported file type: ${fileType.ext}` : 'Unable to determine file type'
        )
      }
      l.dim(`    - Running ffmpeg command for ${input} -> ${outputPath}\n`)
      await execPromise(
        `ffmpeg -i "${input}" -ar 16000 -ac 1 -c:a pcm_s16le "${outputPath}"`,
        { maxBuffer: 10000 * 1024 }
      )
      l.dim(`  File converted to WAV format successfully:\n    - ${outputPath}`)
    } catch (error) {
      err(`Error processing local file: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  } else {
    throw new Error('Invalid option provided for audio download/processing.')
  }
  l.dim(`\n  downloadAudio returning:\n    - outputPath: ${outputPath}\n`)
  return outputPath
}

export async function handleDownloadAudio(request: FastifyRequest, reply: FastifyReply) {
  type DownloadAudioBody = {
    input?: string
    filename?: string
    options?: ProcessingOptions
  }
  const body = request.body as DownloadAudioBody
  const input = body.input
  const filename = body.filename
  if (!input || !filename) {
    reply.status(400).send({ error: 'input and filename are required' })
    return
  }
  const options: ProcessingOptions = body.options || {}
  try {
    const outputPath = await downloadAudio(options,input,filename)
    reply.send({ outputPath })
  } catch (error) {
    reply.status(500).send({ error: (error as Error).message })
  }
}