// src/pages/api/save-markdown.ts

import type { APIRoute } from "astro"
import path from "path"
import { fileURLToPath } from "url"
import { writeFile, join } from "../../utils.ts"
import type { SaveMarkdownRequest } from '../../types.ts'

export const POST: APIRoute = async ({ request }) => {
  console.log("[api/save-markdown] POST request started")
  try {
    const body = await request.json() as SaveMarkdownRequest
    console.log(`[api/save-markdown] Raw request body: ${JSON.stringify(body, null, 2)}`)
    
    const { frontMatter, prompt, transcript, finalPath } = body
    
    if (!frontMatter || !transcript || !finalPath) {
      console.error("[api/save-markdown] Missing required parameters")
      return new Response(JSON.stringify({ error: 'frontMatter, transcript, and finalPath are required' }), { status: 400 })
    }
    
    const content = `${frontMatter}\n${prompt ? prompt + '\n' : ''}## Transcript\n\n${transcript}`
    const markdownFilePath = `${finalPath}.md`
    
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const projectRoot = path.resolve(__dirname, '../../../../')
    const fullPath = join(projectRoot, `${markdownFilePath}`)
    
    await writeFile(fullPath, content, 'utf8')
    
    console.log(`[api/save-markdown] Saved markdown to: ${markdownFilePath}`)
    return new Response(JSON.stringify({ markdownFilePath }), { status: 200 })
  } catch (error) {
    console.error(`[api/save-markdown] Caught error: ${error}`)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return new Response(JSON.stringify({ error: `An error occurred while saving markdown: ${errorMessage}` }), { status: 500 })
  }
}