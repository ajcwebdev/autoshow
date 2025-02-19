// test/cli/validation.test.ts

import test from 'node:test'
import { strictEqual } from 'node:assert/strict'
import { validateOption, validateInputCLI, validateLLM, validateTranscription } from '../../src/utils/validation/cli'

import type { ProcessingOptions } from '../../src/utils/types'

test('validateOption() - single valid option', () => {
  const options: ProcessingOptions = {
    video: 'https://youtube.com/xyz'
  }
  const selected = validateOption(['video', 'playlist', 'file'], options, 'input option')
  strictEqual(selected, 'video', 'Should select the "video" option.')
})

test('validateInputCLI() - should return correct action, LLM, and transcription', () => {
  const options: ProcessingOptions = {
    file: 'content/audio.mp3',
    // whisper: 'tiny',
    whisper: true,
    ollama: 'llama2'
  }

  const result = validateInputCLI(options)
  strictEqual(result.action, 'file', 'Should detect action is "file"')
  strictEqual(result.transcriptServices, 'whisper', 'Should detect whisper for transcription')
  strictEqual(result.llmServices, 'ollama', 'Should detect ollama for LLM')
})

test('validateInputCLI() - should default to whisper if none given', () => {
  const options: ProcessingOptions = {
    file: 'content/audio.mp3'
  }
  const result = validateInputCLI(options)
  strictEqual(result.transcriptServices, 'whisper', 'Should default to whisper if no other is specified')
})

test('validateLLM() - returns correct LLM key if set', () => {
  const options: ProcessingOptions = {
    claude: 'claude-v2'
  }
  const llm = validateLLM(options)
  strictEqual(llm, 'claude', 'Should return "claude" as the LLM key')
})

test('validateLLM() - returns undefined if none set', () => {
  const options: ProcessingOptions = {}
  const llm = validateLLM(options)
  strictEqual(llm, undefined)
})

test('validateTranscription() - detects assembly if --assembly is set', () => {
  const options: ProcessingOptions = {
    assembly: true
  }
  const service = validateTranscription(options)
  strictEqual(service, 'assembly')
})

test('validateTranscription() - fallback to whisper if none is set', () => {
  const options: ProcessingOptions = {}
  const service = validateTranscription(options)
  strictEqual(service, 'whisper', 'Should fallback to whisper if no other transcription service is specified')
})
