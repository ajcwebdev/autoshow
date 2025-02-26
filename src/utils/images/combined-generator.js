// src/utils/images/combined-generator.js

import { generateImageWithDallE } from './dalle-generator.js'
import { generateImageWithStabilityAI } from './stability-ai-generator.js'
import { generateImageWithBlackForestLabs } from './black-forest-labs-generator.js'

// Function to generate the same image with all three services for comparison
async function generateComparisonImages(prompt) {
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
      results[0].status === 'fulfilled' ? 
        `Success - ${results[0].value.path}` : 
        `Failed - ${results[0].reason || 'Unknown error'}`)
    
    console.log('Stability AI Result:', 
      results[1].status === 'fulfilled' ? 
        `Success - ${results[1].value.path}` : 
        `Failed - ${results[1].reason || 'Unknown error'}`)
    
    console.log('Black Forest Labs Result:', 
      results[2].status === 'fulfilled' ? 
        `Success - ${results[2].value.path}` : 
        `Failed - ${results[2].reason || 'Unknown error'}`)
    
    return {
      prompt,
      dalle: results[0].status === 'fulfilled' ? results[0].value : null,
      stability: results[1].status === 'fulfilled' ? results[1].value : null,
      blackForest: results[2].status === 'fulfilled' ? results[2].value : null
    }
  } catch (error) {
    console.error('Error in comparison generation:', error.message)
    return {
      success: false,
      error: error.message,
      details: error.stack
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