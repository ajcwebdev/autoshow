// src/utils/images/stability-ai-generator.js

import { writeFile, mkdir } from 'fs/promises'
import { dirname } from 'path'
import { generateUniqueFilename } from './utils.js'

async function generateImageWithStabilityAI(prompt, outputPath, options = {}) {
  try {
    console.log('Generating image with Stability AI...')
    
    // Generate a unique filename if not specified
    const uniqueOutputPath = outputPath || generateUniqueFilename('stability', 'png')
    
    // Validate API key
    if (!process.env.STABILITY_API_KEY) {
      throw new Error('STABILITY_API_KEY environment variable is missing')
    }
    
    // Default options
    const defaultOptions = {
      engine_id: 'stable-diffusion-xl-1024-v1-0',
      width: 1024,
      height: 1024,
      cfg_scale: 7,
      samples: 1,
      steps: 30,
    }
    
    const config = { ...defaultOptions, ...options }
    
    const response = await fetch(
      `https://api.stability.ai/v1/generation/${config.engine_id}/text-to-image`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`
        },
        body: JSON.stringify({
          text_prompts: [
            {
              text: prompt,
              weight: 1
            }
          ],
          cfg_scale: config.cfg_scale,
          height: config.height,
          width: config.width,
          samples: config.samples,
          steps: config.steps,
        })
      }
    ).catch(error => {
      throw new Error(`Network error: ${error.message}`)
    })

    if (!response.ok) {
      let errorMessage
      try {
        const errorData = await response.json()
        errorMessage = JSON.stringify(errorData)
      } catch (e) {
        errorMessage = `Status ${response.status}: ${response.statusText}`
      }
      throw new Error(`Stability AI API error: ${errorMessage}`)
    }

    const data = await response.json().catch(error => {
      throw new Error(`Error parsing API response: ${error.message}`)
    })

    if (!data.artifacts || !data.artifacts[0] || !data.artifacts[0].base64) {
      throw new Error('Invalid response format from Stability AI API')
    }
    
    // Get the base64 image data from the first result
    const imageData = data.artifacts[0].base64
    
    // Create the output directory if it doesn't exist
    const outputDir = dirname(uniqueOutputPath)
    try {
      await mkdir(outputDir, { recursive: true })
    } catch (err) {
      // Directory might already exist
      if (err.code !== 'EEXIST') throw err
    }
    
    // Save the image
    await writeFile(uniqueOutputPath, Buffer.from(imageData, 'base64'))
    
    console.log(`Image successfully saved to: ${uniqueOutputPath}`)
    return {
      success: true,
      path: uniqueOutputPath,
      seed: data.artifacts[0].seed,
      finishReason: data.artifacts[0].finishReason
    }
  } catch (error) {
    console.error('Error generating image with Stability AI:', error.message)
    return {
      success: false,
      error: error.message,
      details: error.stack
    }
  }
}

// Example usage if file is run directly
if (process.argv[1] === import.meta.url) {
  const prompt = process.argv[2] || 'A serene mountain landscape with a lake reflecting the sunset, photorealistic'
  
  console.log(`Generating Stability AI image with prompt: "${prompt}"`)
  const result = await generateImageWithStabilityAI(prompt)
  console.log(JSON.stringify(result, null, 2))
}

export { generateImageWithStabilityAI }