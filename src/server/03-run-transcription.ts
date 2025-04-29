// src/server/03-run-transcription.ts

import { l, err, logInitialFunctionCall } from '../utils/logging.ts'
import { T_CONFIG } from '../../shared/constants.ts'
import { execPromise, readFile, env } from '../utils/node-utils.ts'
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { ProcessingOptions, RunTranscriptionBody, DeepgramWord } from '../../shared/types.ts'

// Todo Groq

export function formatDeepgramTranscript(
  words: DeepgramWord[],
  speakerLabels: boolean
): string {
  // If no speaker labels requested, return a plain text transcript
  if (!speakerLabels) {
    return words.map(w => w.word).join(' ')
  }

  // Otherwise, group words by speaker
  let transcript = ''
  let currentSpeaker = words.length > 0 && words[0] ? words[0].speaker ?? undefined : undefined
  let speakerWords: string[] = []

  for (const w of words) {
    if (w.speaker !== currentSpeaker) {
      transcript += `Speaker ${currentSpeaker}: ${speakerWords.join(' ')}\n\n`
      currentSpeaker = w.speaker
      speakerWords = []
    }
    speakerWords.push(w.word)
  }

  // Add the final speaker block
  if (speakerWords.length > 0) {
    transcript += `Speaker ${currentSpeaker}: ${speakerWords.join(' ')}`
  }

  return transcript
}

export async function callDeepgram(
  options: ProcessingOptions,
  finalPath: string
) {
  l.dim('\n  callDeepgram called with arguments:')
  l.dim(`    - finalPath: ${finalPath}`)

  if (!env['DEEPGRAM_API_KEY']) {
    throw new Error('DEEPGRAM_API_KEY environment variable is not set. Please set it to your Deepgram API key.')
  }

  try {
    const defaultDeepgramModel = T_CONFIG.deepgram.models.find(m => m.modelId === 'nova-2')?.modelId || 'nova-2'
    const deepgramModel = typeof options.deepgram === 'string'
      ? options.deepgram
      : defaultDeepgramModel

    const modelInfo =
      T_CONFIG.deepgram.models.find(m => m.modelId.toLowerCase() === deepgramModel.toLowerCase())
      || T_CONFIG.deepgram.models.find(m => m.modelId === 'nova-2')

    if (!modelInfo) {
      throw new Error(`Model information for model ${deepgramModel} is not defined.`)
    }

    const { modelId, costPerMinuteCents } = modelInfo

    const apiUrl = new URL('https://api.deepgram.com/v1/listen')
    apiUrl.searchParams.append('model', modelId)
    apiUrl.searchParams.append('smart_format', 'true')
    apiUrl.searchParams.append('punctuate', 'true')
    apiUrl.searchParams.append('diarize', options.speakerLabels ? 'true' : 'false')
    apiUrl.searchParams.append('paragraphs', 'true')

    const audioBuffer = await readFile(`${finalPath}.wav`)

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${env['DEEPGRAM_API_KEY']}`,
        'Content-Type': 'audio/wav'
      },
      body: audioBuffer
    })

    if (!response.ok) {
      throw new Error(`Deepgram API request failed with status ${response.status}`)
    }

    const result = await response.json()

    const channel = result.results?.channels?.[0]
    const alternative = channel?.alternatives?.[0]

    if (!alternative?.words) {
      throw new Error('No transcription results found in Deepgram response')
    }

    const txtContent = formatDeepgramTranscript(alternative.words, options.speakerLabels || false)
    return {
      transcript: txtContent,
      modelId,
      costPerMinuteCents
    }
  } catch (error) {
    err(`Error processing the transcription: ${(error as Error).message}`)
    throw error
  }
}

const BASE_URL = 'https://api.assemblyai.com/v2'

export function formatAssemblyTranscript(transcript: any, speakerLabels: boolean) {
  const inlineFormatTime = (timestamp: number): string => {
    const totalSeconds = Math.floor(timestamp / 1000)
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
    const seconds = (totalSeconds % 60).toString().padStart(2, '0')
    return `${minutes}:${seconds}`
  }

  let txtContent = ''

  if (transcript.utterances && transcript.utterances.length > 0) {
    txtContent = transcript.utterances.map((utt: any) =>
      `${speakerLabels ? `Speaker ${utt.speaker} ` : ''}(${inlineFormatTime(utt.start)}): ${utt.text}`
    ).join('\n')
  } else if (transcript.words && transcript.words.length > 0) {
    const firstWord = transcript.words[0]
    if (!firstWord) {
      throw new Error('No words found in transcript')
    }

    let currentLine = ''
    let currentTimestamp = inlineFormatTime(firstWord.start)

    transcript.words.forEach((word: any) => {
      if (currentLine.length + word.text.length > 80) {
        txtContent += `[${currentTimestamp}] ${currentLine.trim()}\n`
        currentLine = ''
        currentTimestamp = inlineFormatTime(word.start)
      }
      currentLine += `${word.text} `
    })

    if (currentLine.length > 0) {
      txtContent += `[${currentTimestamp}] ${currentLine.trim()}\n`
    }
  } else {
    txtContent = transcript.text || 'No transcription available.'
  }

  return txtContent
}

export async function callAssembly(
  options: ProcessingOptions,
  finalPath: string
) {
  l.dim('\n  callAssembly called with arguments:')
  l.dim(`    - finalPath: ${finalPath}`)

  if (!env['ASSEMBLY_API_KEY']) {
    throw new Error('ASSEMBLY_API_KEY environment variable is not set. Please set it to your AssemblyAI API key.')
  }

  const headers = {
    'Authorization': env['ASSEMBLY_API_KEY'],
    'Content-Type': 'application/json'
  }

  try {
    const { speakerLabels } = options
    const audioFilePath = `${finalPath}.wav`

    const defaultAssemblyModel = T_CONFIG.assembly.models.find(m => m.modelId === 'best')?.modelId || 'best'
    const assemblyModel = typeof options.assembly === 'string'
      ? options.assembly
      : defaultAssemblyModel

    const modelInfo = 
      T_CONFIG.assembly.models.find(m => m.modelId.toLowerCase() === assemblyModel.toLowerCase())
      || T_CONFIG.assembly.models.find(m => m.modelId === 'best')

    if (!modelInfo) {
      throw new Error(`Model information for model ${assemblyModel} is not available.`)
    }

    const { modelId, costPerMinuteCents } = modelInfo

    const fileBuffer = await readFile(audioFilePath)

    const uploadResponse = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': env['ASSEMBLY_API_KEY'],
        'Content-Type': 'application/octet-stream',
      },
      body: fileBuffer
    })

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json()
      throw new Error(`File upload failed: ${errorData.error || uploadResponse.statusText}`)
    }

    const uploadData = await uploadResponse.json()
    const { upload_url } = uploadData
    if (!upload_url) {
      throw new Error('Upload URL not returned by AssemblyAI.')
    }

    const transcriptionOptions = {
      audio_url: upload_url,
      speech_model: modelId as 'default' | 'nano',
      speaker_labels: speakerLabels || false
    }

    const response = await fetch(`${BASE_URL}/transcript`, {
      method: 'POST',
      headers,
      body: JSON.stringify(transcriptionOptions)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const transcriptData = await response.json()

    let transcript
    while (true) {
      const pollingResponse = await fetch(`${BASE_URL}/transcript/${transcriptData.id}`, { headers })
      transcript = await pollingResponse.json()
      if (transcript.status === 'completed' || transcript.status === 'error') {
        break
      }
      await new Promise(resolve => setTimeout(resolve, 3000))
    }

    if (transcript.status === 'error' || transcript.error) {
      throw new Error(`Transcription failed: ${transcript.error}`)
    }

    const txtContent = formatAssemblyTranscript(transcript, speakerLabels || false)
    return {
      transcript: txtContent,
      modelId,
      costPerMinuteCents
    }
  } catch (error) {
    err(`Error processing the transcription: ${(error as Error).message}`)
    throw error
  }
}

export async function runTranscription(options: ProcessingOptions, finalPath: string, transcriptServices?: string) {
  l.step(`\nStep 3 - Run Transcription\n`)
  logInitialFunctionCall('runTranscription', { options, finalPath, transcriptServices })
  let finalTranscript = ''
  let finalModelId = ''
  let finalCostPerMinuteCents = 0
  try {
    switch (transcriptServices) {
      case 'deepgram': {
        const result = await retryTranscriptionCall(() => callDeepgram(options,finalPath))
        l.dim('\n  Deepgram transcription completed successfully.\n')
        finalTranscript = result.transcript
        finalModelId = result.modelId
        finalCostPerMinuteCents = result.costPerMinuteCents
        break
      }
      case 'assembly': {
        const result = await retryTranscriptionCall(() => callAssembly(options,finalPath))
        l.dim('\n  AssemblyAI transcription completed successfully.\n')
        finalTranscript = result.transcript
        finalModelId = result.modelId
        finalCostPerMinuteCents = result.costPerMinuteCents
        break
      }
      default:
        throw new Error(`Unknown transcription service: ${transcriptServices}`)
    }
    const transcriptionCost = await logTranscriptionCost({
      modelId: finalModelId,
      costPerMinuteCents: finalCostPerMinuteCents,
      filePath: `${finalPath}.wav`
    })
    return {
      transcript: finalTranscript,
      transcriptionCost,
      modelId: finalModelId,
      costPerMinuteCents: finalCostPerMinuteCents
    }
  } catch (error) {
    err(`Error during runTranscription: ${(error as Error).message}`)
    throw error
  }
}

export async function retryTranscriptionCall(fn: () => Promise<any>) {
  const maxRetries = 7
  let attempt = 0
  while (attempt < maxRetries) {
    try {
      attempt++
      const result = await fn()
      l.dim(`  Transcription call completed successfully on attempt ${attempt}.`)
      return result
    } catch (error) {
      err(`  Attempt ${attempt} failed: ${(error as Error).message}`)
      if (attempt >= maxRetries) {
        err(`  Max retries (${maxRetries}) reached. Aborting transcription.`)
        throw error
      }
      const delayMs = 1000 * 2 ** (attempt - 1)
      l.dim(`  Retrying in ${delayMs / 1000} seconds...`)
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
  throw new Error('Transcription call failed after maximum retries.')
}

export async function logTranscriptionCost(info: {
  modelId: string
  costPerMinuteCents: number
  filePath: string
}) {
  const cmd = `ffprobe -v error -show_entries format=duration -of csv=p=0 "${info.filePath}"`
  const { stdout } = await execPromise(cmd)
  const seconds = parseFloat(stdout.trim())
  if (isNaN(seconds)) {
    throw new Error(`Could not parse audio duration for file: ${info.filePath}`)
  }
  const minutes = seconds / 60
  const cost = info.costPerMinuteCents * minutes
  l.dim(
    `  - Estimated Transcription Cost for ${info.modelId}:\n` +
    `    - Audio Length: ${minutes.toFixed(2)} minutes\n` +
    `    - Cost: ¢${cost.toFixed(5)}`
  )
  return cost
}

export async function handleRunTranscription(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as RunTranscriptionBody
  const finalPath = body.finalPath
  const transcriptServices = body.transcriptServices
  if (!finalPath || !transcriptServices) {
    reply.status(400).send({ error: 'finalPath and transcriptServices are required' })
    return
  }
  const options: ProcessingOptions = body.options || {}
  try {
    const result = await runTranscription(options,finalPath,transcriptServices)
    reply.send(result)
  } catch (error) {
    reply.status(500).send({ error: (error as Error).message })
  }
}