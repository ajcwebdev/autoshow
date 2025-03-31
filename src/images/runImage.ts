// src/utils/images/index.ts

import { generateComparisonImages } from './combined-generator.ts'
import { generateImageWithDallE } from './dalle-generator.ts'
import { generateImageWithStabilityAI } from './stability-ai-generator.ts'
import { generateImageWithBlackForestLabs } from './black-forest-labs-generator.ts'

const command = process.argv[2]
const prompt = process.argv[3] || 'A beautiful landscape with mountains and a lake at sunset'

/**
 * Main entry point for the image generation CLI tool
 */
async function runImage() {
  console.log('Image Generation API Tool')
  console.log('------------------------')
  
  try {
    // Validate environment variables
    if (command === 'dalle' && !process.env['OPENAI_API_KEY']) {
      console.error('Error: OPENAI_API_KEY environment variable is missing')
      process.exit(1)
    }
    
    if (command === 'stability' && !process.env['STABILITY_API_KEY']) {
      console.error('Error: STABILITY_API_KEY environment variable is missing')
      process.exit(1)
    }
    
    if (command === 'blackforest' && !process.env['BFL_API_KEY']) {
      console.error('Error: BFL_API_KEY environment variable is missing')
      process.exit(1)
    }
    
    let result
    
    switch (command) {
      case 'dalle':
        console.log(`Generating DALL-E image with prompt: "${prompt}"`)
        result = await generateImageWithDallE(prompt)
        break
        
      case 'stability':
        console.log(`Generating Stability AI image with prompt: "${prompt}"`)
        result = await generateImageWithStabilityAI(prompt)
        break
        
      case 'blackforest':
        console.log(`Generating Black Forest Labs image with prompt: "${prompt}"`)
        result = await generateImageWithBlackForestLabs(prompt)
        break
        
      case 'compare':
        console.log(`Comparing all services with prompt: "${prompt}"`)
        result = await generateComparisonImages(prompt)
        break
        
      default:
        console.log('Available commands:')
        console.log('  dalle <prompt> - Generate image with DALL-E 3')
        console.log('  stability <prompt> - Generate image with Stability AI')
        console.log('  blackforest <prompt> - Generate image with Black Forest Labs')
        console.log('  compare <prompt> - Compare all three services')
        return
    }
    
    console.log('Result:')
    console.log(JSON.stringify(result, null, 2))
  } catch (error) {
    console.error('Fatal error:', (error as Error).message)
    console.error((error as Error).stack)
    process.exit(1)
  }
}

runImage().catch(error => {
  console.error('Unhandled error:', error)
  process.exit(1)
})