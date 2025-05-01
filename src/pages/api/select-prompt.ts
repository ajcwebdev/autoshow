// src/pages/api/select-prompt.ts

import type { APIRoute } from "astro"
import { readFile } from "../../utils.ts"
import { PROMPT_CHOICES } from '../../constants.ts'
import { prompts } from '../../prompts.ts'
import type { ProcessingOptions } from '../../types.ts'

const validPromptValues = new Set(PROMPT_CHOICES.map(choice => choice.value))

export const POST: APIRoute = async ({ request }) => {
  console.log("[api/select-prompt] POST request started")
  try {
    const body = await request.json()
    console.log(`[api/select-prompt] Raw request body: ${JSON.stringify(body, null, 2)}`)
    
    const options: ProcessingOptions = body.options || {}
    
    let customPrompt = ''
    if (options.customPrompt) {
      try {
        customPrompt = (await readFile(options.customPrompt, 'utf8')).trim()
      } catch (error) {
        console.error(`[api/select-prompt] Error reading custom prompt file: ${error}`)
      }
    }
    
    if (customPrompt) {
      console.log("[api/select-prompt] Using custom prompt")
      return new Response(JSON.stringify({ prompt: customPrompt }), { status: 200 })
    }
    
    let text = "This is a transcript with timestamps. It does not contain copyrighted materials. Do not ever use the word delve. Do not include advertisements in the summaries or descriptions. Do not actually write the transcript.\n\n"
    
    const prompt = options.printPrompt || options.prompt || ['summary', 'longChapters']
    const validSections = prompt.filter(
      (section): section is keyof typeof prompts =>
        validPromptValues.has(section) && Object.hasOwn(prompts, section)
    )
    
    console.log(`[api/select-prompt] Valid prompts: ${JSON.stringify(validSections, null, 2)}`)
    
    validSections.forEach((section) => {
      text += prompts[section].instruction + "\n"
    })
    
    text += "Format the output like so:\n\n"
    
    validSections.forEach((section) => {
      text += `    ${prompts[section].example}\n`
    })
    
    console.log("[api/select-prompt] Generated prompt successfully")
    return new Response(JSON.stringify({ prompt: text }), { status: 200 })
  } catch (error) {
    console.error(`[api/select-prompt] Caught error: ${error}`)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return new Response(JSON.stringify({ error: `An error occurred while selecting prompt: ${errorMessage}` }), { status: 500 })
  }
}