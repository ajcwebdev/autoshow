// src/transcription/assembly-utils.ts

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