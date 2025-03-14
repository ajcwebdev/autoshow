// src/utils/images/combined-generator.ts

import { generateImageWithDallE } from './dalle-generator'
import { generateImageWithStabilityAI } from './stability-ai-generator'
import { generateImageWithBlackForestLabs } from './black-forest-labs-generator'

import type { GenerateImageResponse } from './black-forest-labs-generator'

/**
 * The result of generating the same prompt with all three services
 */
interface ComparisonResult {
  prompt: string
  dalle: GenerateImageResponse | null
  stability: GenerateImageResponse | null
  blackForest: GenerateImageResponse | null
}

/**
 * Generate the same image with all three services for comparison
 * @param prompt - The text prompt to generate images from
 * @returns A promise resolving with a comparison result
 */
async function generateComparisonImages(prompt: string): Promise<ComparisonResult | { success: false, error: string, details?: string }> {
  console.log(`Generating comparison images for prompt: "${prompt}"`)
  
  try {
    // Create promises for all three generators
    const dallePromise = generateImageWithDallE(prompt)
    const stabilityPromise = generateImageWithStabilityAI(prompt)
    const blackForestPromise = generateImageWithBlackForestLabs(prompt)
    
    // Run all three in parallel and wait for all to complete
    const results = await Promise.allSettled([
      dallePromise,
      stabilityPromise,
      blackForestPromise
    ])
    
    // Process and log results
    console.log('--- Generation Results ---')
    
    console.log('DALL-E 3 Result:',
      results[0].status === 'fulfilled' && results[0].value.success
        ? `Success - ${results[0].value.path}`
        : `Failed - ${
            results[0].status === 'rejected'
              ? results[0].reason
              : 'Unknown error'
          }`
    )
    
    console.log('Stability AI Result:',
      results[1].status === 'fulfilled' && results[1].value.success
        ? `Success - ${results[1].value.path}`
        : `Failed - ${
            results[1].status === 'rejected'
              ? results[1].reason
              : 'Unknown error'
          }`
    )
    
    console.log('Black Forest Labs Result:',
      results[2].status === 'fulfilled' && results[2].value.success
        ? `Success - ${results[2].value.path}`
        : `Failed - ${
            results[2].status === 'rejected'
              ? results[2].reason
              : 'Unknown error'
          }`
    )
    
    return {
      prompt,
      dalle: results[0].status === 'fulfilled' ? results[0].value : null,
      stability: results[1].status === 'fulfilled' ? results[1].value : null,
      blackForest: results[2].status === 'fulfilled' ? results[2].value : null
    }
  } catch (error) {
    console.error('Error in comparison generation:', (error as Error).message)
    return {
      success: false,
      error: (error as Error).message,
      details: (error as Error).stack
    }
  }
}

// Run comparison if file is executed directly
if (process.argv[1] === import.meta.url) {
  const prompt = process.argv[2] || "An astronaut riding a horse on Mars, detailed, cinematic lighting"
  console.log(`Running comparison with prompt: "${prompt}"`)
  const results = await generateComparisonImages(prompt)
  console.log(JSON.stringify(results, null, 2))
}

export {
  generateComparisonImages,
  generateImageWithDallE,
  generateImageWithStabilityAI,
  generateImageWithBlackForestLabs
}