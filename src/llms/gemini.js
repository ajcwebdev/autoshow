// src/llms/gemini.js

import { writeFile } from 'node:fs/promises'
import { env } from 'node:process'
import { GoogleGenerativeAI } from "@google/generative-ai"

const geminiModel = {
  GEMINI_1_5_FLASH: "gemini-1.5-flash",
  // GEMINI_1_5_PRO: "gemini-1.5-pro",
  GEMINI_1_5_PRO: "gemini-1.5-pro-exp-0827",
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function callGemini(transcriptContent, outputFilePath, model = 'GEMINI_1_5_FLASH') {
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)
  const actualModel = geminiModel[model] || geminiModel.GEMINI_1_5_FLASH
  const gem = genAI.getGenerativeModel({ model: actualModel })
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await gem.generateContent(transcriptContent)
      const response = await result.response
      const text = response.text()
      if (!text) {
        throw new Error("No text generated from Gemini")
      }
      await writeFile(outputFilePath, text)
      console.log(`Transcript saved to ${outputFilePath}`)
      console.log(`\nModel: ${actualModel}`)
      return model
    } catch (error) {
      console.error(`Error in callGemini (attempt ${attempt}/${maxRetries}):`, error)
      if (attempt === maxRetries) {
        throw error
      }
      await delay(Math.pow(2, attempt) * 1000)
    }
  }
}