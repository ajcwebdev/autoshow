// web/src/pages/api/cost.ts

import type { APIRoute } from "astro"
import { computeAllTranscriptCosts, computeAllLLMCosts } from "../../../../src/server/cost.ts"

export const POST: APIRoute = async ({ request }) => {
  console.log("[api/cost] POST request started")
  try {
    const body = await request.json()
    console.log(`[api/cost] Raw request body: ${JSON.stringify(body)}`)
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
    if (type === 'transcriptCost') {
      console.log("[api/cost] Calling computeAllTranscriptCosts")
      const costResults = await computeAllTranscriptCosts(filePath)
      console.log("[api/cost] Successfully computed transcriptCost", JSON.stringify(costResults))
      return new Response(JSON.stringify({ transcriptCost: costResults }), { status: 200 })
    } else {
      console.log("[api/cost] Calling computeAllLLMCosts")
      const costResults = await computeAllLLMCosts(filePath)
      console.log("[api/cost] Successfully computed llmCost", JSON.stringify(costResults))
      return new Response(JSON.stringify({ llmCost: costResults }), { status: 200 })
    }
  } catch (error) {
    console.error(`[api/cost] Caught error: ${error}`)
    return new Response(JSON.stringify({ error: 'An error occurred while processing the cost request' }), { status: 500 })
  }
}
