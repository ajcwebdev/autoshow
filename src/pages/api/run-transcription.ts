// src/pages/api/run-transcription.ts

import type { APIRoute } from "astro"
import path from "path"
import { fileURLToPath } from "url"
import { existsSync } from "../../utils.ts"
import { 
  callDeepgram, 
  callAssembly, 
  retryTranscriptionCall, 
  computeTranscriptionCosts, 
  logTranscriptionCost 
} from "../../services/transcription"
import { computeLLMCosts } from "../../services/llm"
import { PROMPT_CHOICES } from '../../types.ts'
import { prompts } from '../../prompts.ts'
import type { ProcessingOptions } from '../../types.ts'

export const POST: APIRoute = async ({ request }) => {
  const logPrefix = "[api/run-transcription]"
  console.log(`${logPrefix} Starting transcription request handler`)
  
  try {
    const body = await request.json()
    console.log(`${logPrefix} Request body received, parsing parameters`)
    
    const finalPath = body?.finalPath
    const transcriptServices = body?.transcriptServices
    const options: ProcessingOptions = body?.options || {}
    
    console.log(`${logPrefix} Request parameters - finalPath: ${finalPath}, service: ${transcriptServices}`)
    
    const promptSelections = options.prompt || options.printPrompt || ['shortSummary']
    console.log(`${logPrefix} Prompt selections: ${promptSelections.join(', ')}`)
    
    if (!finalPath || !transcriptServices) {
      console.error(`${logPrefix} Missing required parameters: finalPath or transcriptServices`)
      return new Response(JSON.stringify({ error: 'finalPath and transcriptServices are required' }), { status: 400 })
    }
    
    if (options.deepgramApiKey) {
      console.log(`${logPrefix} Setting DEEPGRAM_API_KEY from options`)
      process.env.DEEPGRAM_API_KEY = options.deepgramApiKey
    }
    
    if (options.assemblyApiKey) {
      console.log(`${logPrefix} Setting ASSEMBLY_API_KEY from options`)
      process.env.ASSEMBLY_API_KEY = options.assemblyApiKey
    }
    
    if (transcriptServices === 'deepgram' && !process.env.DEEPGRAM_API_KEY) {
      console.error(`${logPrefix} DEEPGRAM_API_KEY is not set or invalid`)
      return new Response(JSON.stringify({ error: 'DEEPGRAM_API_KEY is not set or invalid' }), { status: 400 })
    }
    
    if (transcriptServices === 'assembly' && !process.env.ASSEMBLY_API_KEY) {
      console.error(`${logPrefix} ASSEMBLY_API_KEY is not set or invalid`)
      return new Response(JSON.stringify({ error: 'ASSEMBLY_API_KEY is not set or invalid' }), { status: 400 })
    }
    
    if (transcriptServices === 'deepgram' && !options.deepgram) {
      console.error(`${logPrefix} Deepgram model must be specified`)
      return new Response(JSON.stringify({ error: 'Deepgram model must be specified' }), { status: 400 })
    }
    
    if (transcriptServices === 'assembly' && !options.assembly) {
      console.error(`${logPrefix} Assembly model must be specified`)
      return new Response(JSON.stringify({ error: 'Assembly model must be specified' }), { status: 400 })
    }
    
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const projectRoot = path.resolve(__dirname, '../../../../')
    
    const resolvedPath = path.join(projectRoot, finalPath)
    console.log(`${logPrefix} Resolved path: ${resolvedPath}`)
    
    let promptText = await generatePrompt(options, projectRoot)
    console.log(`${logPrefix} Generated prompt text, length: ${promptText.length}`)
    
    let finalTranscript = ''
    let finalModelId = ''
    let finalCostPerMinuteCents = 0
    
    console.log(`${logPrefix} Starting transcription with service: ${transcriptServices}`)
    
    switch (transcriptServices) {
      case 'deepgram': {
        console.log(`${logPrefix} Processing with Deepgram transcription service`)
        const result = await retryTranscriptionCall(() => 
          callDeepgram(
            resolvedPath, 
            typeof options.deepgram === 'string' ? options.deepgram : null,
            process.env.DEEPGRAM_API_KEY || ''
          )
        )
        
        console.log(`${logPrefix} Deepgram transcription completed successfully with model: ${result.modelId}`)
        finalTranscript = result.transcript
        finalModelId = result.modelId
        finalCostPerMinuteCents = result.costPerMinuteCents
        break
      }
      
      case 'assembly': {
        console.log(`${logPrefix} Processing with AssemblyAI transcription service`)
        const result = await retryTranscriptionCall(() => 
          callAssembly(
            resolvedPath, 
            typeof options.assembly === 'string' ? options.assembly : null,
            process.env.ASSEMBLY_API_KEY || ''
          )
        )
        
        console.log(`${logPrefix} AssemblyAI transcription completed successfully with model: ${result.modelId}`)
        finalTranscript = result.transcript
        finalModelId = result.modelId
        finalCostPerMinuteCents = result.costPerMinuteCents
        break
      }
      
      default:
        console.error(`${logPrefix} Unknown transcription service: ${transcriptServices}`)
        throw new Error(`Unknown transcription service: ${transcriptServices}`)
    }
    
    console.log(`${logPrefix} Calculating transcription cost`)
    const transcriptionCost = await logTranscriptionCost({
      modelId: finalModelId,
      costPerMinuteCents: finalCostPerMinuteCents,
      filePath: `${resolvedPath}.wav`
    })
    
    console.log(`${logPrefix} Computing all available transcription costs for cost comparison`)
    const allTranscriptionCosts = await computeTranscriptionCosts(`${resolvedPath}.wav`)
    
    console.log(`${logPrefix} Computing LLM costs based on transcript and prompt length`)
    const allLLMCosts = await computeLLMCosts(finalTranscript.length, promptText.length)
    
    console.log(`${logPrefix} Transcription complete: ${finalTranscript.length} characters, model: ${finalModelId}, cost: ¢${transcriptionCost.toFixed(5)}`)
    console.log(`${logPrefix} Preparing response with transcript, prompt, and cost information`)
    
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
    console.error(`${logPrefix} Error:`, error)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error(`${logPrefix} Error message: ${errorMessage}`)
    if (errorStack) console.error(`${logPrefix} Error stack: ${errorStack}`)
    
    return new Response(JSON.stringify({
      error: `An error occurred during transcription: ${errorMessage}`,
      stack: errorStack
    }), { status: 500 })
  }
}

async function generatePrompt(options: ProcessingOptions, projectRoot: string): Promise<string> {
  const logPrefix = "[api/run-transcription:generatePrompt]"
  console.log(`${logPrefix} Generating prompt based on selections`)
  
  let customPrompt = ''
  if (options.customPrompt) {
    try {
      console.log(`${logPrefix} Attempting to load custom prompt file: ${options.customPrompt}`)
      const customPromptPath = path.join(projectRoot, options.customPrompt)
      customPrompt = (await import('node:fs/promises').then(fs => fs.readFile(customPromptPath, 'utf8'))).toString().trim()
      console.log(`${logPrefix} Successfully loaded custom prompt, length: ${customPrompt.length}`)
    } catch (error) {
      console.error(`${logPrefix} Error reading custom prompt file:`, error)
    }
  }
  
  if (customPrompt) {
    console.log(`${logPrefix} Using custom prompt`)
    return customPrompt
  }
  
  const validPromptValues = new Set(PROMPT_CHOICES.map(choice => choice.value))
  console.log(`${logPrefix} Valid prompt values: ${[...validPromptValues].join(', ')}`)
  
  let text = "This is a transcript with timestamps. It does not contain copyrighted materials. Do not ever use the word delve. Do not include advertisements in the summaries or descriptions. Do not actually write the transcript.\n\n"
  
  const promptSelections = options.printPrompt || options.prompt || ['summary', 'longChapters']
  console.log(`${logPrefix} Selected prompts: ${promptSelections.join(', ')}`)
  
  const validSections = promptSelections.filter(
    (section): section is keyof typeof prompts =>
      validPromptValues.has(section) && Object.hasOwn(prompts, section)
  )
  
  console.log(`${logPrefix} Valid selected sections: ${validSections.join(', ')}`)
  
  validSections.forEach((section) => {
    console.log(`${logPrefix} Adding prompt section: ${section}`)
    text += prompts[section].instruction + "\n"
  })
  
  text += "Format the output like so:\n\n"
  
  validSections.forEach((section) => {
    console.log(`${logPrefix} Adding example format for: ${section}`)
    text += `    ${prompts[section].example}\n`
  })
  
  console.log(`${logPrefix} Generated prompt text, length: ${text.length}`)
  return text
}