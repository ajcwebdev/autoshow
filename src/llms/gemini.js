// src/llms/gemini.js

import { writeFile } from 'node:fs/promises'
import { env } from 'node:process'
import { GoogleGenerativeAI } from "@google/generative-ai"

// Define available Gemini models
const geminiModel = {
  GEMINI_1_5_FLASH: "gemini-1.5-flash",
  // GEMINI_1_5_PRO: "gemini-1.5-pro",
  GEMINI_1_5_PRO: "gemini-1.5-pro-exp-0827",
}

// Utility function to introduce a delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Main function to call Gemini API
export async function callGemini(transcriptContent, outputFilePath, model = 'GEMINI_1_5_FLASH') {
  // Initialize the Google Generative AI client
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)
  
  // Select the actual model to use, defaulting to GEMINI_1_5_FLASH if not specified
  const actualModel = geminiModel[model] || geminiModel.GEMINI_1_5_FLASH
  
  // Get the generative model
  const gem = genAI.getGenerativeModel({ model: actualModel })
  
  const maxRetries = 3; // Maximum number of retry attempts
  
  // Retry loop
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Generate content using the selected model
      const result = await gem.generateContent(transcriptContent)
      
      // Get the response from the generated content
      const response = await result.response
      
      // Extract the text from the response
      const text = response.text()
      
      // Check if text was generated
      if (!text) {
        throw new Error("No text generated from Gemini")
      }
      
      // Write the generated text to the output file
      await writeFile(outputFilePath, text)
      
      console.log(`Transcript saved to ${outputFilePath}`)
      console.log(`\nModel: ${actualModel}`)
      
      // Return the model name used
      return model
    } catch (error) {
      console.error(`Error in callGemini (attempt ${attempt}/${maxRetries}):`, error)
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error
      }
      
      // Wait before retrying, with exponential backoff
      await delay(Math.pow(2, attempt) * 1000)
    }
  }
}