// src/transcription/deepgram-utils.ts

/**
 * Represents a single word object in the Deepgram transcription response,
 * which may include speaker labels when diarization is enabled.
 */
export interface DeepgramWord {
  /**
   * The transcribed word
   */
  word: string

  /**
   * The start timestamp (in seconds) of the word in the audio
   */
  start: number

  /**
   * The end timestamp (in seconds) of the word in the audio
   */
  end: number

  /**
   * The confidence score (0.0 - 1.0) for the recognized word
   */
  confidence: number

  /**
   * The speaker number assigned to this word (e.g., 0, 1, 2)
   * Only provided if diarization (speaker labels) is enabled
   */
  speaker?: number

  /**
   * The confidence score for the assigned speaker (pre-recorded only)
   */
  speaker_confidence?: number
}

/**
 * Formats the Deepgram transcript by either merging all words into a single text string
 * or, if speaker labels are enabled, grouping the transcription by speaker.
 *
 * @param {DeepgramWord[]} words - The array of word objects returned from the Deepgram API
 * @param {boolean} speakerLabels - Whether to include speaker labeling
 * @returns {string} - The formatted transcript, with or without speaker labels
 */
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