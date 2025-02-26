// src/utils/images/dalle-generator.js

import { writeFile, mkdir } from 'fs/promises'
import { dirname } from 'path'
import { generateUniqueFilename } from './utils.js'

async function generateImageWithDallE(prompt, outputPath) {
  try {
    console.log('Generating image with DALL-E 3...')
    
    // Generate a unique filename if not specified
    const uniqueOutputPath = outputPath || generateUniqueFilename('dalle', 'png')
    
    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is missing')
    }
    
    const response = await fetch(
      'https://api.openai.com/v1/images/generations',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
          response_format: 'b64_json'
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
      throw new Error(`OpenAI API error: ${errorMessage}`)
    }

    const data = await response.json().catch(error => {
      throw new Error(`Error parsing API response: ${error.message}`)
    })
    
    if (!data.data || !data.data[0] || !data.data[0].b64_json) {
      throw new Error('Invalid response format from OpenAI API')
    }
    
    // Get the base64 image data
    const imageData = data.data[0].b64_json
    
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
      prompt_used: data.data[0].revised_prompt || prompt
    }
  } catch (error) {
    console.error('Error generating image with DALL-E:', error.message)
    return {
      success: false,
      error: error.message,
      details: error.stack
    }
  }
}

// Example usage if file is run directly
if (process.argv[1] === import.meta.url) {
  const prompt = process.argv[2] || 'A futuristic cityscape with flying cars and holographic advertisements, cyberpunk style'
  
  console.log(`Generating DALL-E image with prompt: "${prompt}"`)
  const result = await generateImageWithDallE(prompt)
  console.log(JSON.stringify(result, null, 2))
}

export { generateImageWithDallE }