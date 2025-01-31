// src/process-steps/05-run-llm.ts

import { writeFile, readFile } from 'node:fs/promises'
import { insertShowNote } from '../server'
import { l, err, logInitialFunctionCall } from '../utils/logging'
import { retryLLMCall } from '../utils/step-utils/retry'
import { LLM_FUNCTIONS } from '../utils/step-utils/llm-utils'
import type { ProcessingOptions, EpisodeMetadata } from '../utils/types/process'
import type { LLMServices } from '../utils/types/llms'

/**
 * Processes a transcript using a specified Language Model service.
 * Handles the complete workflow from combining the transcript to generating
 * and saving the final markdown output for multiple LLM services.
 * 
 * The function performs these steps:
 * 1. Combines the transcript with a provided prompt (if any)
 * 2. Processes the content with the selected LLM
 * 3. Saves the results with front matter and transcript or prompt+transcript
 * 4. Inserts show notes into the database
 * 
 * If no LLM is selected, it writes the front matter, prompt, and transcript to a file.
 * If an LLM is selected, it writes the front matter, showNotes, and transcript to a file.
 * 
 * @param {ProcessingOptions} options - Configuration options including:
 *   - prompt: Array of prompt sections to include
 *   - LLM-specific options (e.g., chatgpt, claude, etc.)
 * @param {string} finalPath - Base path for input/output files:
 *   - Final output: `${finalPath}-${llmServices}-shownotes.md` (if LLM is used)
 *   - Otherwise: `${finalPath}-prompt.md`
 * @param {string} frontMatter - YAML front matter content to include in the output
 * @param {string} prompt - Optional prompt or instructions to process
 * @param {string} transcript - The transcript content
 * @param {EpisodeMetadata} metadata - The metadata object from generateMarkdown
 * @param {LLMServices} [llmServices] - The LLM service to use
 * @returns {Promise<string>} Resolves with the LLM output, or an empty string if no LLM is selected
 */
export async function runLLM(
  options: ProcessingOptions,
  finalPath: string,
  frontMatter: string,
  prompt: string,
  transcript: string,
  metadata: EpisodeMetadata,
  llmServices?: LLMServices,
) {
  l.step(`\nStep 5 - Run Language Model\n`)
  logInitialFunctionCall('runLLM', { llmServices, metadata })

  try {
    let showNotesResult = ''
    if (llmServices) {
      l.dim(`\n  Preparing to process with '${llmServices}' Language Model...\n`)
      const llmFunction = LLM_FUNCTIONS[llmServices]

      if (!llmFunction) {
        throw new Error(`Invalid LLM option: ${llmServices}`)
      }
      let showNotes = ''

      await retryLLMCall(
        async () => {
          const llmOptions = options[llmServices] ?? '';
          showNotes = await llmFunction(prompt, transcript, llmOptions)
        },
        5,
        5000
      )

      const outputFilename = `${finalPath}-${llmServices}-shownotes.md`
      await writeFile(outputFilename, `${frontMatter}\n${showNotes}\n\n## Transcript\n\n${transcript}`)
      l.dim(`\n  LLM processing completed, combined front matter + LLM output + transcript written to:\n    - ${outputFilename}`)
      showNotesResult = showNotes
    } else {
      l.dim('  No LLM selected, skipping processing...')
      const noLLMFile = `${finalPath}-prompt.md`
      l.dim(`\n  Writing front matter + prompt + transcript to file:\n    - ${noLLMFile}`)
      await writeFile(noLLMFile, `${frontMatter}\n${prompt}\n## Transcript\n\n${transcript}`)
    }

    insertShowNote({
      showLink: metadata.showLink ?? '',
      channel: metadata.channel ?? '',
      channelURL: metadata.channelURL ?? '',
      title: metadata.title ?? '',
      description: metadata.description ?? '',
      publishDate: metadata.publishDate ?? '',
      coverImage: metadata.coverImage ?? '',
      frontmatter: frontMatter,
      prompt,
      transcript,
      llmOutput: showNotesResult
    })

    return showNotesResult
  } catch (error) {
    err(`Error running Language Model: ${(error as Error).message}`)
    throw error
  }
}

/**
 * @public
 * @typedef {Object} ParsedPromptFile
 * @property {string} frontMatter - The extracted front matter (including --- lines).
 * @property {string} prompt - The prompt text to be processed.
 * @property {string} transcript - The transcript text to be processed (if any).
 * @property {EpisodeMetadata} metadata - The metadata object parsed from front matter.
 */

/**
 * Utility function to parse a markdown file that may contain front matter,
 * a prompt, and optionally a transcript section (marked by "## Transcript").
 * 
 * Front matter is assumed to be between the first pair of '---' lines at the top.
 * The content after front matter and before "## Transcript" is considered prompt,
 * and any content after "## Transcript" is considered transcript.
 *
 * Any recognized YAML keys in the front matter are mapped into the metadata object.
 * 
 * @param {string} fileContent - The content of the markdown file
 * @returns {ParsedPromptFile} An object containing frontMatter, prompt, transcript, and metadata
 */
function parsePromptFile(fileContent: string) {
  let frontMatter = ''
  let prompt = ''
  let transcript = ''
  let metadata: EpisodeMetadata = {
    showLink: '',
    channel: '',
    channelURL: '',
    title: '',
    description: '',
    publishDate: '',
    coverImage: ''
  }

  const lines = fileContent.split('\n')
  let readingFrontMatter = false
  let frontMatterDone = false
  let readingTranscript = false

  for (const line of lines) {
    if (!frontMatterDone && line.trim() === '---') {
      // Toggle front matter reading on/off
      readingFrontMatter = !readingFrontMatter

      frontMatter += `${line}\n`
      if (!readingFrontMatter) {
        frontMatterDone = true
      }
      continue
    }

    if (!frontMatterDone && readingFrontMatter) {
      // Inside front matter
      frontMatter += `${line}\n`

      // Capture known metadata from lines like: key: "value"
      const match = line.match(/^(\w+):\s*"?([^"]+)"?/)
      if (match) {
        const key = match[1]
        const value = match[2]
        if (key === 'showLink') metadata.showLink = value
        if (key === 'channel') metadata.channel = value
        if (key === 'channelURL') metadata.channelURL = value
        if (key === 'title') metadata.title = value
        if (key === 'description') metadata.description = value
        if (key === 'publishDate') metadata.publishDate = value
        if (key === 'coverImage') metadata.coverImage = value
      }
      continue
    }

    if (line.trim().toLowerCase().startsWith('## transcript')) {
      readingTranscript = true
      transcript += `${line}\n`
      continue
    }

    if (readingTranscript) {
      transcript += `${line}\n`
    } else {
      prompt += `${line}\n`
    }
  }

  return { frontMatter, prompt, transcript, metadata }
}

/**
 * Reads a prompt markdown file and runs Step 5 (LLM processing) directly,
 * bypassing the earlier steps of front matter generation, audio download, and transcription.
 * 
 * The markdown file is expected to contain optional front matter delimited by '---' lines,
 * followed by prompt text, and optionally a "## Transcript" section.
 * 
 * This function extracts that content and calls {@link runLLM} with the user-specified LLM service.
 * 
 * @param {string} filePath - The path to the .md file containing front matter, prompt, and optional transcript
 * @param {ProcessingOptions} options - Configuration options (including any LLM model flags)
 * @param {LLMServices} llmServices - The chosen LLM service (e.g., 'chatgpt', 'claude', etc.)
 * @returns {Promise<void>} A promise that resolves when the LLM processing completes
 */
export async function runLLMFromPromptFile(
  filePath: string,
  options: ProcessingOptions,
  llmServices: LLMServices,
): Promise<void> {
  try {
    const fileContent = await readFile(filePath, 'utf8')
    const { frontMatter, prompt, transcript, metadata } = parsePromptFile(fileContent)

    // Derive a base "finalPath" from the file path, removing the .md extension if present
    const finalPath = filePath.replace(/\.[^.]+$/, '')

    // Execute Step 5
    await runLLM(
      options,
      finalPath,
      frontMatter,
      prompt,
      transcript,
      metadata,
      llmServices
    )
  } catch (error) {
    err(`Error in runLLMFromPromptFile: ${(error as Error).message}`)
    throw error
  }
}