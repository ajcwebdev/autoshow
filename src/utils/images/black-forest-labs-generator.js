// src/utils/images/black-forest-labs-generator.js

import { writeFile, mkdir } from 'fs/promises'
import { dirname } from 'path'
import { generateUniqueFilename, sleep } from './utils.js'

async function generateImageWithBlackForestLabs(prompt, outputPath, options = {}) {
  try {
    console.log('Generating image with Black Forest Labs...')
    
    // Generate a unique filename if not specified
    const uniqueOutputPath = outputPath || generateUniqueFilename('blackforest', 'jpg')
    
    // Validate API key
    if (!process.env.BFL_API_KEY) {
      throw new Error('BFL_API_KEY environment variable is missing')
    }
    
    // Default options
    const defaultOptions = {
      width: 1024,
      height: 768,
      prompt_upsampling: false,
      seed: Math.floor(Math.random() * 1000000),
      safety_tolerance: 2,
      output_format: "jpeg"
    }
    
    const config = { ...defaultOptions, ...options }
    
    // Step 1: Submit the generation request
    console.log('Submitting generation request to Black Forest Labs...')
    const submitResponse = await fetch(
      'https://api.bfl.ml/v1/flux-pro-1.1',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Key': process.env.BFL_API_KEY
        },
        body: JSON.stringify({
          prompt: prompt,
          width: config.width,
          height: config.height,
          prompt_upsampling: config.prompt_upsampling,
          seed: config.seed,
          safety_tolerance: config.safety_tolerance,
          output_format: config.output_format
        })
      }
    ).catch(error => {
      throw new Error(`Network error during submission: ${error.message}`)
    })
    
    if (!submitResponse.ok) {
      let errorMessage
      try {
        const errorData = await submitResponse.json()
        errorMessage = JSON.stringify(errorData)
      } catch (e) {
        errorMessage = `Status ${submitResponse.status}: ${submitResponse.statusText}`
      }
      
      // Check for specific error codes
      if (submitResponse.status === 429) {
        throw new Error('BFL API rate limit exceeded: You have too many active tasks (limit is 24). Wait for some tasks to complete before submitting more.')
      } else if (submitResponse.status === 402) {
        throw new Error('BFL API error: Out of credits. Please add more credits at https://api.us1.bfl.ai')
      } else {
        throw new Error(`BFL API error during submission: ${errorMessage}`)
      }
    }
    
    const submitData = await submitResponse.json().catch(error => {
      throw new Error(`Error parsing API submission response: ${error.message}`)
    })
    
    if (!submitData.id) {
      throw new Error('Invalid response format from BFL API: missing id')
    }
    
    const taskId = submitData.id
    console.log(`BFL generation task submitted. Task ID: ${taskId}`)
    
    // Step 2: Poll for completion
    let imageUrl = null
    let attempts = 0
    const maxAttempts = 120 // 10 minutes with 5-second intervals
    
    console.log('Polling for results...')
    while (!imageUrl && attempts < maxAttempts) {
      attempts++
      
      await sleep(5000) // Wait 5 seconds between checks
      
      const statusResponse = await fetch(
        `https://api.bfl.ml/v1/get_result?id=${taskId}`,
        {
          headers: {
            'X-Key': process.env.BFL_API_KEY
          }
        }
      ).catch(error => {
        console.warn(`Network error when checking status (attempt ${attempts}): ${error.message}`)
        // Continue polling despite temporary network errors
        return null
      })
      
      // Skip this iteration if the request failed
      if (!statusResponse) continue
      
      if (!statusResponse.ok) {
        let errorMessage
        try {
          const errorData = await statusResponse.json()
          errorMessage = JSON.stringify(errorData)
        } catch (e) {
          errorMessage = `Status ${statusResponse.status}: ${statusResponse.statusText}`
        }
        console.warn(`Error checking task status (attempt ${attempts}): ${errorMessage}`)
        // Continue polling despite temporary errors
        continue
      }
      
      const statusData = await statusResponse.json().catch(error => {
        console.warn(`Error parsing status response (attempt ${attempts}): ${error.message}`)
        // Continue polling despite temporary JSON parsing errors
        return null
      })
      
      // Skip this iteration if parsing failed
      if (!statusData) continue
      
      console.log(`Task status (attempt ${attempts}): ${statusData.status || 'Unknown'}, Progress: ${statusData.progress || 'Unknown'}`)
      
      // Check for different status values based on the API docs
      if (statusData.status === 'Ready' && statusData.result && statusData.result.sample) {
        imageUrl = statusData.result.sample
        console.log('Image generation complete! URL received.')
      } else if (statusData.status === 'Failed') {
        throw new Error(`BFL generation failed: ${statusData.details?.error || 'Unknown error'}`)
      }
      // For other statuses, continue polling
    }
    
    if (!imageUrl) {
      throw new Error('BFL generation timed out after 10 minutes')
    }
    
    // Step 3: Download the image
    console.log('Downloading generated image...')
    const imageResponse = await fetch(imageUrl).catch(error => {
      throw new Error(`Error downloading image: ${error.message}`)
    })
    
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`)
    }
    
    const imageBuffer = await imageResponse.arrayBuffer().catch(error => {
      throw new Error(`Error reading image data: ${error.message}`)
    })
    
    // Create the output directory if it doesn't exist
    const outputDir = dirname(uniqueOutputPath)
    try {
      await mkdir(outputDir, { recursive: true })
    } catch (err) {
      // Directory might already exist
      if (err.code !== 'EEXIST') throw err
    }
    
    // Save the image
    await writeFile(uniqueOutputPath, Buffer.from(imageBuffer))
    
    console.log(`Image successfully saved to: ${uniqueOutputPath}`)
    return {
      success: true,
      path: uniqueOutputPath,
      taskId: taskId,
      imageUrl: imageUrl,
      seed: config.seed
    }
  } catch (error) {
    console.error('Error generating image with Black Forest Labs:', error.message)
    return {
      success: false,
      error: error.message,
      details: error.stack
    }
  }
}

// Example usage if file is run directly
if (process.argv[1] === import.meta.url) {
  const prompt = process.argv[2] || 'Fantasy landscape with a floating castle in the clouds, magical atmosphere, detailed, high resolution'
  
  console.log(`Generating Black Forest Labs image with prompt: "${prompt}"`)
  const result = await generateImageWithBlackForestLabs(prompt)
  console.log(JSON.stringify(result, null, 2))
}

export { generateImageWithBlackForestLabs }