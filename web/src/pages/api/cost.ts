// web/src/pages/api/cost.ts

import type { APIRoute } from "astro"
import path from "path"
import { fileURLToPath } from "url"
import fs from "fs"
import { execPromise } from "../../../../src/utils.ts"
import { T_CONFIG, L_CONFIG } from "../../../../shared/constants.ts"

async function getAudioDurationInSeconds(filePath: string) {
  console.log(`getAudioDurationInSeconds called with filePath: ${filePath}`)
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`)
  }
  
  const cmd = `ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`
  console.log(`Executing command: ${cmd}`)
  const { stdout } = await execPromise(cmd)
  console.log(`ffprobe stdout: ${stdout}`)
  const seconds = parseFloat(stdout.trim())
  console.log(`Parsed duration: ${seconds}`)
  if (isNaN(seconds)) {
    throw new Error(`Could not parse audio duration for file: ${filePath}`)
  }
  return seconds
}

async function computeAllTranscriptCosts(filePath: string) {
  console.log(`computeAllTranscriptCosts called with filePath: ${filePath}`)
  const seconds = await getAudioDurationInSeconds(filePath)
  const minutes = seconds / 60
  console.log(`Total minutes: ${minutes}`)
  const result: Record<string, Array<{ modelId: string, cost: number }>> = {}
  
  for (const [serviceName, config] of Object.entries(T_CONFIG)) {
    console.log(`Processing service: ${serviceName}`)
    result[serviceName] = []
    for (const model of config.models) {
      const cost = model.costPerMinuteCents * minutes
      const finalCost = parseFloat(cost.toFixed(10))
      console.log(`Model: ${model.modelId}, cost: ${finalCost}`)
      result[serviceName].push({ modelId: model.modelId, cost: finalCost })
    }
  }
  
  console.log(`Final transcriptCost result: ${JSON.stringify(result)}`)
  return result
}

async function computeAllLLMCosts(filePath: string) {
  console.log(`computeAllLLMCosts called with filePath: ${filePath}`)
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`)
  }
  
  const content = await fs.promises.readFile(filePath, 'utf8')
  console.log(`Read file content length: ${content.length}`)
  const tokenCount = Math.max(1, content.trim().split(/\s+/).length)
  console.log(`Calculated token count: ${tokenCount}`)
  const estimatedOutputTokens = 4000
  const result: Record<string, Array<{ modelId: string, cost: number }>> = {}
  
  for (const [serviceName, config] of Object.entries(L_CONFIG)) {
    if (!config.models || config.models.length === 0) {
      console.log(`Skipping service: ${serviceName}, no models found`)
      continue
    }
    console.log(`Processing service: ${serviceName}`)
    result[serviceName] = []
    for (const model of config.models) {
      const inputCostRate = (model.inputCostC || 0) / 100
      const outputCostRate = (model.outputCostC || 0) / 100
      const inputCost = (tokenCount / 1_000_000) * inputCostRate
      const outputCost = (estimatedOutputTokens / 1_000_000) * outputCostRate
      const totalCost = parseFloat((inputCost + outputCost).toFixed(10))
      console.log(`Model: ${model.modelId}, inputCostRate: ${inputCostRate}, outputCostRate: ${outputCostRate}, totalCost: ${totalCost}`)
      result[serviceName].push({ modelId: model.modelId, cost: totalCost })
    }
  }
  
  console.log(`Final llmCost result: ${JSON.stringify(result)}`)
  return result
}

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
    
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const projectRoot = path.resolve(__dirname, '../../../../')
    
    // Try a few different path resolutions to find the file
    let resolvedPath = path.resolve(projectRoot, filePath)
    console.log(`[api/cost] First resolved path attempt: ${resolvedPath}`)
    
    // If file doesn't exist at first path, try alternate paths
    if (!fs.existsSync(resolvedPath)) {
      // Try with just filename (no directory)
      const filename = path.basename(filePath)
      const altPath1 = path.resolve(projectRoot, filename)
      console.log(`[api/cost] Trying alternate path 1: ${altPath1}`)
      
      if (fs.existsSync(altPath1)) {
        resolvedPath = altPath1
      } else {
        // Try with content directory
        const altPath2 = path.resolve(projectRoot, 'content', filename)
        console.log(`[api/cost] Trying alternate path 2: ${altPath2}`)
        
        if (fs.existsSync(altPath2)) {
          resolvedPath = altPath2
        }
      }
    }
    
    console.log(`[api/cost] Final resolved path: ${resolvedPath}`)
    
    if (!fs.existsSync(resolvedPath)) {
      return new Response(JSON.stringify({ 
        error: `File not found. Tried: ${resolvedPath}` 
      }), { status: 404 })
    }
    
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
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return new Response(JSON.stringify({ error: `An error occurred while processing the cost request: ${errorMessage}` }), { status: 500 })
  }
}