// src/transcription/assembly.ts

import { l, err } from '../utils/logging.ts'
import { readFile, env } from '../utils/node-utils.ts'
import { T_CONFIG } from '../../shared/constants.ts'

import type { ProcessingOptions } from '../../shared/types.ts'

const BASE_URL = 'https://api.assemblyai.com/v2'

/**
 * Formats the AssemblyAI transcript into text with timestamps and optional speaker labels.
 * Logic:
 * - If transcript.utterances are present, format each utterance line with optional speaker labels and timestamps.
 * - If only transcript.words are available, group them into lines ~80 chars, prepend each line with a timestamp.
 * - If no structured data is available, use the raw transcript text or 'No transcription available.' as fallback.
 *
 * @param transcript - The polling response from AssemblyAI after transcription completes
 * @param speakerLabels - Whether to include speaker labels in the output
 * @returns The fully formatted transcript as a string
 * @throws If words are expected but not found (no content to format)
 */
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

/**
 * Main function to handle transcription using AssemblyAI.
 * @param options - Additional processing options (e.g., speaker labels)
 * @param finalPath - The base filename (without extension) for input/output files
 * @returns {Promise<TranscriptionResult>}
 * @throws {Error} If any step of the process fails (upload, transcription request, polling, formatting)
 */
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