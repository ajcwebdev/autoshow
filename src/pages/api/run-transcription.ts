// src/pages/api/run-transcription.ts

import type { APIRoute } from "astro"
import {
  callDeepgram,
  callAssembly,
  retryTranscriptionCall,
  computeTranscriptionCosts,
  logTranscriptionCost
} from "../../services/transcription"
import { computeLLMCosts } from "../../services/llm"
import { s3Service } from "../../services/s3"
import { dirname, resolve, join, fileURLToPath, l, err } from '../../utils'
import { PROMPT_CHOICES } from '../../types.ts'
import { prompts } from '../../prompts.ts'
import type { ProcessingOptions } from '../../types.ts'

export const POST: APIRoute = async ({ request }) => {
  const pre = "[api/run-transcription]"
  l(`${pre} Starting transcription request handler`)
  
  try {
    const body = await request.json()
    l(`${pre} Request body received, parsing parameters`)
    
    const finalPath = body?.finalPath
    const s3Url = body?.s3Url
    const transcriptServices = body?.transcriptServices
    const options: ProcessingOptions = body?.options || {}
    const showNoteId = body?.showNoteId
    
    l(`${pre} Request parameters - finalPath: ${finalPath}, s3Url: ${s3Url}, service: ${transcriptServices}, showNoteId: ${showNoteId}`)
    
    const promptSelections = options.prompt || options.printPrompt || ['shortSummary']
    l(`${pre} Prompt selections: ${promptSelections.join(', ')}`)
    
    if (!finalPath || !transcriptServices || !showNoteId) {
      err(`${pre} Missing required parameters: finalPath, transcriptServices, or showNoteId`)
      return new Response(JSON.stringify({ error: 'finalPath, transcriptServices, and showNoteId are required' }), { status: 400 })
    }
    
    if (options.deepgramApiKey) {
      l(`${pre} Setting DEEPGRAM_API_KEY from options`)
      process.env.DEEPGRAM_API_KEY = options.deepgramApiKey
    }
    
    if (options.assemblyApiKey) {
      l(`${pre} Setting ASSEMBLY_API_KEY from options`)
      process.env.ASSEMBLY_API_KEY = options.assemblyApiKey
    }
    
    if (transcriptServices === 'deepgram' && !process.env.DEEPGRAM_API_KEY) {
      err(`${pre} DEEPGRAM_API_KEY is not set or invalid`)
      return new Response(JSON.stringify({ error: 'DEEPGRAM_API_KEY is not set or invalid' }), { status: 400 })
    }
    
    if (transcriptServices === 'assembly' && !process.env.ASSEMBLY_API_KEY) {
      err(`${pre} ASSEMBLY_API_KEY is not set or invalid`)
      return new Response(JSON.stringify({ error: 'ASSEMBLY_API_KEY is not set or invalid' }), { status: 400 })
    }
    
    if (transcriptServices === 'deepgram' && !options.deepgram) {
      err(`${pre} Deepgram model must be specified`)
      return new Response(JSON.stringify({ error: 'Deepgram model must be specified' }), { status: 400 })
    }
    
    if (transcriptServices === 'assembly' && !options.assembly) {
      err(`${pre} Assembly model must be specified`)
      return new Response(JSON.stringify({ error: 'Assembly model must be specified' }), { status: 400 })
    }
    
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    const projectRoot = resolve(__dirname, '../../../../')
    const resolvedPath = join(projectRoot, finalPath)
    l(`${pre} Resolved path: ${resolvedPath}`)
    
    let promptText = await generatePrompt(options, projectRoot)
    l(`${pre} Generated prompt text, length: ${promptText.length}`)
    
    let finalTranscript = ''
    let finalModelId = ''
    let finalCostPerMinuteCents = 0
    
    l(`${pre} Starting transcription with service: ${transcriptServices}`)
    const audioSource = s3Url || resolvedPath
    l(`${pre} Using audio source: ${audioSource}`)
    
    switch (transcriptServices) {
      case 'deepgram': {
        l(`${pre} Processing with Deepgram transcription service`)
        const result = await retryTranscriptionCall(() =>
          callDeepgram(
            audioSource,
            typeof options.deepgram === 'string' ? options.deepgram : null,
            process.env.DEEPGRAM_API_KEY || ''
          )
        )
        l(`${pre} Deepgram transcription completed successfully with model: ${result.modelId}`)
        finalTranscript = result.transcript
        finalModelId = result.modelId
        finalCostPerMinuteCents = result.costPerMinuteCents
        break
      }
      case 'assembly': {
        l(`${pre} Processing with AssemblyAI transcription service`)
        const result = await retryTranscriptionCall(() =>
          callAssembly(
            audioSource,
            typeof options.assembly === 'string' ? options.assembly : null,
            process.env.ASSEMBLY_API_KEY || ''
          )
        )
        l(`${pre} AssemblyAI transcription completed successfully with model: ${result.modelId}`)
        finalTranscript = result.transcript
        finalModelId = result.modelId
        finalCostPerMinuteCents = result.costPerMinuteCents
        break
      }
      default:
        err(`${pre} Unknown transcription service: ${transcriptServices}`)
        throw new Error(`Unknown transcription service: ${transcriptServices}`)
    }
    
    l(`${pre} Calculating transcription cost`)
    const wavFilePath = s3Url || `${resolvedPath}.wav`
    const transcriptionCost = await logTranscriptionCost({
      modelId: finalModelId,
      costPerMinuteCents: finalCostPerMinuteCents,
      filePath: wavFilePath
    })
    
    l(`${pre} Saving transcription to S3`)
    await s3Service.saveTranscription(showNoteId, finalTranscript)
    
    l(`${pre} Updating show note with transcription metadata`)
    await s3Service.updateShowNote(showNoteId, {
      transcriptionService: transcriptServices,
      transcriptionModel: finalModelId,
      transcriptionCost,
      prompt: promptText
    })
    
    l(`${pre} Computing all available transcription costs for cost comparison`)
    const allTranscriptionCosts = await computeTranscriptionCosts(wavFilePath)
    
    l(`${pre} Computing LLM costs based on transcript and prompt length`)
    const allLLMCosts = await computeLLMCosts(finalTranscript.length, promptText.length)
    
    l(`${pre} Transcription complete: ${finalTranscript.length} characters, model: ${finalModelId}, cost: ¢${transcriptionCost.toFixed(5)}`)
    l(`${pre} Preparing response with transcript, prompt, and cost information`)
    
    return new Response(JSON.stringify({
      transcript: finalTranscript,
      prompt: promptText,
      transcriptionService: transcriptServices,
      transcriptionModel: finalModelId,
      transcriptionCost,
      allTranscriptionCosts,
      allLLMCosts
    }), { status: 200 })
  } catch (error) {
    err(`${pre} Error:`, error)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    const errorStack = error instanceof Error ? error.stack : undefined
    err(`${pre} Error message: ${errorMessage}`)
    if (errorStack) err(`${pre} Error stack: ${errorStack}`)
    
    return new Response(JSON.stringify({
      error: `An error occurred during transcription: ${errorMessage}`,
      stack: errorStack
    }), { status: 500 })
  }
}

async function generatePrompt(options: ProcessingOptions, projectRoot: string): Promise<string> {
  const pre = "[api/run-transcription:generatePrompt]"
  l(`${pre} Generating prompt based on selections`)
  
  let customPrompt = ''
  if (options.customPrompt) {
    try {
      l(`${pre} Attempting to load custom prompt file: ${options.customPrompt}`)
      const customPromptPath = join(projectRoot, options.customPrompt)
      customPrompt = (await import('node:fs/promises').then(fs => fs.readFile(customPromptPath, 'utf8'))).toString().trim()
      l(`${pre} Successfully loaded custom prompt, length: ${customPrompt.length}`)
    } catch (error) {
      err(`${pre} Error reading custom prompt file:`, error)
    }
  }
  
  if (customPrompt) {
    l(`${pre} Using custom prompt`)
    return customPrompt
  }
  
  const validPromptValues = new Set(PROMPT_CHOICES.map(choice => choice.value))
  l(`${pre} Valid prompt values: ${[...validPromptValues].join(', ')}`)
  
  let text = "This is a transcript with timestamps. It does not contain copyrighted materials. Do not ever use the word delve. Do not include advertisements in the summaries or descriptions. Do not actually write the transcript.\n\n"
  const promptSelections = options.printPrompt || options.prompt || ['summary', 'longChapters']
  l(`${pre} Selected prompts: ${promptSelections.join(', ')}`)
  
  const validSections = promptSelections.filter(
    (section): section is keyof typeof prompts =>
      validPromptValues.has(section) && Object.hasOwn(prompts, section)
  )
  l(`${pre} Valid selected sections: ${validSections.join(', ')}`)
  
  validSections.forEach((section) => {
    l(`${pre} Adding prompt section: ${section}`)
    text += prompts[section].instruction + "\n"
  })
  
  text += "Format the output like so:\n\n"
  validSections.forEach((section) => {
    l(`${pre} Adding example format for: ${section}`)
    text += `    ${prompts[section].example}\n`
  })
  
  l(`${pre} Generated prompt text, length: ${text.length}`)
  return text
}