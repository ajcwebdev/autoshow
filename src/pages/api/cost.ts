// web/src/pages/api/cost.ts

import type { APIRoute } from "astro"
import path from "path"
import { fileURLToPath } from "url"
import fs from "fs"
import { execPromise } from "../../utils.ts"
import { T_CONFIG, L_CONFIG } from '../../constants.ts'

async function getAudioDurationInSeconds(filePath: string) {
  console.log(`getAudioDurationInSeconds called with filePath: ${filePath}`)
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`)
    // List the directory contents to help with debugging
    try {
      const dirPath = path.dirname(filePath)
      console.log(`Listing contents of directory: ${dirPath}`)
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath)
        console.log(`Directory contents: ${JSON.stringify(files)}`)
      } else {
        console.log(`Directory doesn't exist: ${dirPath}`)
      }
    } catch (error) {
      console.error(`Error listing directory: ${error}`)
    }
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
    console.log(`[api/cost] Project root: ${projectRoot}`)
    
    // Check if the filePath is already an absolute path
    const isAbsolutePath = path.isAbsolute(filePath)
    console.log(`[api/cost] Is filePath absolute? ${isAbsolutePath}`)
    
    let resolvedPath = isAbsolutePath ? filePath : path.resolve(projectRoot, filePath)
    console.log(`[api/cost] First resolved path attempt: ${resolvedPath}`)
    
    // Check if this path exists
    const originalPathExists = fs.existsSync(resolvedPath)
    console.log(`[api/cost] Does original path exist? ${originalPathExists}`)
    
    if (!originalPathExists) {
      // Try various alternative paths
      const filename = path.basename(filePath)
      console.log(`[api/cost] Extracted filename: ${filename}`)
      
      const altPath1 = path.resolve(projectRoot, filename)
      console.log(`[api/cost] Trying alternate path 1: ${altPath1}`)
      const altPath1Exists = fs.existsSync(altPath1)
      console.log(`[api/cost] Does alt path 1 exist? ${altPath1Exists}`)
      
      if (altPath1Exists) {
        resolvedPath = altPath1
      } else {
        const contentDir = path.resolve(projectRoot, 'content')
        console.log(`[api/cost] Content directory: ${contentDir}`)
        
        // List content directory if it exists
        if (fs.existsSync(contentDir)) {
          console.log(`[api/cost] Listing content directory: ${contentDir}`)
          const contentFiles = fs.readdirSync(contentDir)
          console.log(`[api/cost] Content directory files: ${JSON.stringify(contentFiles)}`)
        } else {
          console.log(`[api/cost] Content directory doesn't exist: ${contentDir}`)
        }
        
        const altPath2 = path.resolve(contentDir, filename)
        console.log(`[api/cost] Trying alternate path 2: ${altPath2}`)
        const altPath2Exists = fs.existsSync(altPath2)
        console.log(`[api/cost] Does alt path 2 exist? ${altPath2Exists}`)
        
        if (altPath2Exists) {
          resolvedPath = altPath2
        }
      }
    }
    
    console.log(`[api/cost] Final resolved path: ${resolvedPath}`)
    const finalPathExists = fs.existsSync(resolvedPath)
    console.log(`[api/cost] Does final path exist? ${finalPathExists}`)
    
    if (!finalPathExists) {
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