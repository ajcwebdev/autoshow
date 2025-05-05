// src/services/llm.ts

import { OpenAI } from "openai"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { L_CONFIG } from '../types'
import { l, err } from '../utils'
import type { LLMResult, ChatGPTModelValue, ClaudeModelValue, GeminiModelValue, GroqModelValue } from '../types'

export async function retryLLMCall(fn: () => Promise<any>): Promise<any> {
  const pre = "[llm.service]"
  const maxRetries = 7
  let attempt = 0
  while (attempt < maxRetries) {
    try {
      attempt++
      if (attempt > 1) {
        l(`${pre} LLM retry attempt ${attempt}`)
      }
      const result = await fn()
      return result
    } catch (error) {
      err(`${pre} LLM call failed (attempt ${attempt}):`, error)
      if (attempt >= maxRetries) {
        throw error
      }
      const delayMs = 1000 * 2 ** (attempt - 1)
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
  throw new Error('LLM call failed after maximum retries.')
}

export async function callChatGPT(modelValue: ChatGPTModelValue, prompt: string, transcript: string): Promise<LLMResult> {
  const pre = "[llm.service:callChatGPT]"
  l(`${pre} Starting ChatGPT call with model: ${modelValue}`)
  
  if (!process.env.OPENAI_API_KEY) {
    err(`${pre} Missing OPENAI_API_KEY`)
    throw new Error('Missing OPENAI_API_KEY')
  }
  
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const combinedPrompt = `${prompt}\n\n## Transcript\n\n${transcript}`
  
  l(`${pre} Preparing request with combined prompt length: ${combinedPrompt.length}`)
  
  try {
    l(`${pre} Sending request to OpenAI API`)
    const response = await openai.chat.completions.create({
      model: modelValue,
      messages: [{ role: 'user', content: combinedPrompt }]
    })
    
    l(`${pre} Received response from OpenAI API`)
    
    const firstChoice = response.choices[0]
    if (!firstChoice?.message?.content) {
      err(`${pre} No valid response content from ChatGPT API`)
      throw new Error('No valid response content from ChatGPT API')
    }
    
    const content = firstChoice.message.content
    l(`${pre} Successfully processed response, content length: ${content.length}`)
    
    return {
      content,
      usage: {
        stopReason: firstChoice.finish_reason ?? 'unknown',
        input: response.usage?.prompt_tokens,
        output: response.usage?.completion_tokens,
        total: response.usage?.total_tokens
      }
    }
  } catch (error) {
    err(`${pre} Error calling ChatGPT:`, error)
    throw error
  }
}

export async function callGroq(modelValue: GroqModelValue, prompt: string, transcript: string): Promise<LLMResult> {
  const pre = "[llm.service:callGroq]"
  l(`${pre} Starting Groq call with model: ${modelValue}`)
  
  if (!process.env.GROQ_API_KEY) {
    err(`${pre} Missing GROQ_API_KEY environment variable`)
    throw new Error('Missing GROQ_API_KEY environment variable.')
  }
  
  const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1'
  })
  
  const combinedPrompt = `${prompt}\n\n## Transcript\n\n${transcript}`
  l(`${pre} Preparing request with combined prompt length: ${combinedPrompt.length}`)
  
  try {
    l(`${pre} Sending request to Groq API`)
    const response = await groq.chat.completions.create({
      model: modelValue,
      messages: [{ role: 'user', content: combinedPrompt }]
    })
    
    l(`${pre} Received response from Groq API`)
    
    const firstChoice = response.choices[0]
    if (!firstChoice?.message?.content) {
      err(`${pre} No valid response content from Groq API`)
      throw new Error('No valid response content from Groq API')
    }
    
    const content = firstChoice.message.content
    l(`${pre} Successfully processed response, content length: ${content.length}`)
    
    return {
      content,
      usage: {
        stopReason: firstChoice.finish_reason ?? 'unknown',
        input: response.usage?.prompt_tokens,
        output: response.usage?.completion_tokens,
        total: response.usage?.total_tokens
      }
    }
  } catch (error) {
    err(`${pre} Error calling Groq:`, error)
    throw error
  }
}

export async function callClaude(modelValue: ClaudeModelValue, prompt: string, transcript: string): Promise<LLMResult> {
  const pre = "[llm.service:callClaude]"
  l(`${pre} Starting Claude call with model: ${modelValue}`)
  
  if (!process.env.ANTHROPIC_API_KEY) {
    err(`${pre} Missing ANTHROPIC_API_KEY environment variable`)
    throw new Error('Missing ANTHROPIC_API_KEY environment variable.')
  }
  
  const anthropic = new OpenAI({
    apiKey: process.env.ANTHROPIC_API_KEY,
    baseURL: 'https://api.anthropic.com/v1/'
  })
  
  const combinedPrompt = `${prompt}\n\n## Transcript\n\n${transcript}`
  l(`${pre} Preparing request with combined prompt length: ${combinedPrompt.length}`)
  
  try {
    l(`${pre} Sending request to Anthropic API`)
    const response = await anthropic.chat.completions.create({
      model: modelValue,
      max_tokens: 4096,
      messages: [{ role: 'user', content: combinedPrompt }]
    })
    
    l(`${pre} Received response from Anthropic API`)
    
    const firstChoice = response.choices[0]
    if (!firstChoice?.message?.content) {
      err(`${pre} No valid text content generated by Claude`)
      throw new Error('No valid text content generated by Claude.')
    }
    
    const content = firstChoice.message.content
    l(`${pre} Successfully processed response, content length: ${content.length}`)
    
    return {
      content,
      usage: {
        stopReason: firstChoice.finish_reason ?? 'unknown',
        input: response.usage?.prompt_tokens,
        output: response.usage?.completion_tokens,
        total: response.usage?.total_tokens
      }
    }
  } catch (error) {
    err(`${pre} Error calling Claude:`, error)
    throw error
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function callGemini(modelValue: GeminiModelValue, prompt: string, transcript: string): Promise<LLMResult> {
  const pre = "[llm.service:callGemini]"
  l(`${pre} Starting Gemini call with model: ${modelValue}`)
  
  if (!process.env.GEMINI_API_KEY) {
    err(`${pre} Missing GEMINI_API_KEY environment variable`)
    throw new Error('Missing GEMINI_API_KEY environment variable.')
  }
  
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  const geminiModel = genAI.getGenerativeModel({ model: modelValue })
  
  const combinedPrompt = `${prompt}\n\n## Transcript\n\n${transcript}`
  l(`${pre} Preparing request with combined prompt length: ${combinedPrompt.length}`)
  
  const maxRetries = 3
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      l(`${pre} Sending request to Gemini API (attempt ${attempt}/${maxRetries})`)
      const result = await geminiModel.generateContent(combinedPrompt)
      
      l(`${pre} Received response from Gemini API`)
      
      const response = result.response
      const text = response.text()
      
      l(`${pre} Successfully processed response, content length: ${text.length}`)
      
      const { usageMetadata } = response
      const { promptTokenCount, candidatesTokenCount, totalTokenCount } = usageMetadata ?? {}
      
      return {
        content: text,
        usage: {
          stopReason: response.candidates?.[0]?.finishReason || 'unknown',
          input: promptTokenCount,
          output: candidatesTokenCount,
          total: totalTokenCount
        }
      }
    } catch (error) {
      err(`${pre} Error in callGemini (attempt ${attempt}/${maxRetries}):`, error)
      if (attempt === maxRetries) throw error
      
      const backoffMs = 2 ** attempt * 1000
      l(`${pre} Retrying after ${backoffMs}ms delay`)
      await delay(backoffMs)
    }
  }
  
  throw new Error('Exhausted all Gemini API call retries without success.')
}

export async function computeLLMCosts(transcriptLength: number, promptLength: number): Promise<Record<string, Array<{ modelId: string, modelName: string, cost: number }>>> {
  const pre = "[llm.service:computeLLMCosts]"
  l(`${pre} Computing LLM costs for transcript length: ${transcriptLength}, prompt length: ${promptLength}`)
  
  const totalInputTokens = Math.max(1, Math.ceil((transcriptLength + promptLength) / 4))
  const estimatedOutputTokens = 4000
  
  l(`${pre} Estimated input tokens: ${totalInputTokens}, estimated output tokens: ${estimatedOutputTokens}`)
  
  const result: Record<string, Array<{ modelId: string, modelName: string, cost: number }>> = {}
  
  Object.entries(L_CONFIG).forEach(([serviceName, config]) => {
    if (serviceName === 'skip') {
      l(`${pre} Skipping 'skip' service for cost calculation`)
      return
    }
    
    if (!config.models || config.models.length === 0) {
      l(`${pre} No models found for service: ${serviceName}`)
      return
    }
    
    l(`${pre} Calculating costs for service: ${serviceName}`)
    result[serviceName] = []
    
    config.models.forEach(model => {
      const inputCostRate = (model.inputCostC || 0) / 100
      const outputCostRate = (model.outputCostC || 0) / 100
      
      const inputCost = (totalInputTokens / 1_000_000) * inputCostRate
      const outputCost = (estimatedOutputTokens / 1_000_000) * outputCostRate
      const totalCost = parseFloat((inputCost + outputCost).toFixed(10))
      
      l(`${pre} Model: ${model.modelId}, Input cost: ${inputCost}, Output cost: ${outputCost}, Total cost: ${totalCost}`)
      
      result[serviceName].push({
        modelId: model.modelId,
        modelName: model.modelName || model.modelId,
        cost: totalCost
      })
    })
  })
  
  l(`${pre} Completed cost calculations`)
  return result
}