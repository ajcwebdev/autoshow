// web/src/pages/api/cost.ts

import type { APIRoute } from "astro"
import path from "path"
import { fileURLToPath } from "url"
import { computeAllTranscriptCosts, computeAllLLMCosts } from "../../../../src/server/cost.ts"

export const POST: APIRoute = async ({ request }) => {
  console.log("[api/cost] POST request started")
  try {
    const body = await request.json()
    console.log(`[api/cost] Raw request body: ${JSON.stringify(body, null, 2)}`)
    const type = body?.type
    const filePath = body?.filePath
    console.log(`[api/cost] type: ${type}`)
    console.log(`[api/cost] filePath: ${filePath}`)
    
    if (!['transcriptCost','llmCost'].includes(type)) {
      console.error("[api/cost] Invalid cost type")
      return new Response(JSON.stringify({ error: 'Valid cost type is required (transcriptCost or llmCost)' }), { status: 400 })
    }
    
    if (!filePath) {
      console.error("[api/cost] No filePath provided")
      return new Response(JSON.stringify({ error: 'File path (or URL for audio) is required' }), { status: 400 })
    }
    
    // Resolve path relative to project root
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const projectRoot = path.resolve(__dirname, '../../../../')
    const resolvedPath = path.resolve(projectRoot, filePath)
    
    console.log(`[api/cost] Resolved path: ${resolvedPath}`)
    
    if (type === 'transcriptCost') {
      console.log("[api/cost] Calling computeAllTranscriptCosts")
      const costResults = await computeAllTranscriptCosts(resolvedPath)
      console.log("[api/cost] Successfully computed transcriptCost", JSON.stringify(costResults, null, 2))
      return new Response(JSON.stringify({ transcriptCost: costResults }), { status: 200 })
    } else {
      console.log("[api/cost] Calling computeAllLLMCosts")
      const costResults = await computeAllLLMCosts(resolvedPath)
      console.log("[api/cost] Successfully computed llmCost", JSON.stringify(costResults, null, 2))
      return new Response(JSON.stringify({ llmCost: costResults }), { status: 200 })
    }
  } catch (error) {
    console.error(`[api/cost] Caught error: ${error}`)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: `An error occurred while processing the cost request: ${errorMessage}` }), { status: 500 })
  }
}