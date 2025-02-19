# Create Your Own LLM Plugins

The first section of this doc, "How to Add a Plugin," details the steps for adding a new LLM option. "Gibbity" is a made up LLM name that stands in for something like Cohere or Mistral.

## How to Add a Plugin

Add `GIBBITY_API_KEY` to `.env`.

```bash
GIBBITY_API_KEY=
```

Add `--gibbity` and `--gibbityApiKey` options in `src/commander.ts`.

```ts
// src/commander.ts

program
  // LLM service options
  .option('--gibbity [model]', 'Use Gibbity for processing with optional model specification')
  // Options to override environment variables from CLI
  .option('--gibbityApiKey <key>', 'Specify Gibbity API key (overrides .env variable)')
```

Add `gibbity` and `gibbityApiKey` to `ProcessingOptions` type in `src/types/process.ts`.

```ts
// src/types/process.ts

export type ProcessingOptions = {
  gibbity?: string
  gibbityApiKey?: string
}
```

Add `GIBBITY_MODELS` to `ALL_MODELS` in `shared/constants.ts`.

```ts
// shared/constants.ts

import { GIBBITY_MODELS } from '../src/llms/gibbity'

export const ALL_MODELS = {
  ...GIBBITY_MODELS,
  // Rest of models
}
```

Add `callGibbity` to `LLM_FUNCTIONS` in `src/utils/llm-utils.ts`.

```ts
// src/utils/llm-utils.ts

import { callGibbity } from '../../llms/gibbity'

export const LLM_FUNCTIONS = {
  gibbity: callGibbity,
  // Rest of functions
}
```

Add `gibbityApiKey` to `envVarsMap` in `src/utils/validate-cli.ts`.

```ts
// src/utils/validate-cli.ts

export const envVarsMap = {
  gibbityApiKey: 'GIBBITY_API_KEY',
}
```

Add `gibbityApiKey` to `envVarsServerMap` in `src/utils/validate-req.ts`.

```ts
// src/utils/validate-req.ts

export const envVarsServerMap = {
  gibbityApiKey: 'GIBBITY_API_KEY',
}
```

Add `gibbity` to `LLMServices` type in `src/types/llms.ts`.

```ts
// src/types/llms.ts

export type LLMServices = 'gibbity' | // Rest of services
```

## Grok

Create `grok.ts` file in `src/llms` and `grok.test.ts` file in `test/models`.

```bash
echo '' > src/llms/grok.ts
echo '' > test/models/grok.test.ts
```

Add the following to `src/llms/grok.ts`:

```ts
// src/llms/grok.ts

import { env } from 'node:process'
import { OpenAI } from 'openai'
import { err } from '../utils/logging'
import { logLLMCost } from '../utils/step-utils/llm-utils'

/**
 * Available Grok models.
 */
export type GrokModelType = 'GROK_2_LATEST'

/**
 * Configuration for Grok models, mapping model types to their display names and identifiers.
 * Pricing is hypothetical or as provided by xAI docs
 */
export const GROK_MODELS = {
  GROK_2_LATEST: {
    name: 'Grok 2 Latest',
    modelId: 'grok-2-latest',
    inputCostPer1M: 2.00,
    outputCostPer1M: 10.00
  },
}

/**
 * Calls the Grok API to generate a response to a prompt and transcript.
 * Uses the xAI-compatible OpenAI interface with a custom baseURL.
 *
 * @param {string} prompt - The prompt or instructions for Grok
 * @param {string} transcript - The transcript or additional context to process
 * @param {GrokModelType | string | { modelId: string } | boolean} [model='GROK_2_LATEST'] - The Grok model to use (defaults to GROK_2_LATEST).
 *   Note: a boolean may appear if the CLI is used like `--grok` with no model specified. We handle that by defaulting to 'grok-2-latest'.
 * @throws Will throw an error if GROK_API_KEY is not set or if the API call fails
 * @returns {Promise<string>} The generated text from Grok
 */
export async function callGrok(
  prompt: string,
  transcript: string,
  model: GrokModelType | string | { modelId: string } | boolean = 'GROK_2_LATEST'
): Promise<string> {
  if (!env['GROK_API_KEY']) {
    throw new Error('GROK_API_KEY environment variable is not set. Please set it to your xAI Grok API key.')
  }

  // Safely parse the model parameter, since it can be a string, object, or boolean
  const modelId = typeof model === 'boolean'
    ? 'grok-2-latest'
    : typeof model === 'object'
      ? model?.modelId ?? 'grok-2-latest'
      : typeof model === 'string'
        ? model
        : 'grok-2-latest'

  const openai = new OpenAI({
    apiKey: env['GROK_API_KEY'],
    baseURL: 'https://api.x.ai/v1',
  })

  try {
    const combinedPrompt = `${prompt}\n${transcript}`

    const response = await openai.chat.completions.create({
      model: modelId,
      messages: [
        {
          role: 'user',
          content: combinedPrompt
        }
      ],
    })

    const firstChoice = response.choices[0]
    if (!firstChoice || !firstChoice.message?.content) {
      throw new Error('No valid response received from Grok API')
    }

    const content = firstChoice.message.content

    if (response.usage) {
      logLLMCost({
        modelName: modelId,
        stopReason: firstChoice.finish_reason ?? 'unknown',
        tokenUsage: {
          input: response.usage.prompt_tokens,
          output: response.usage.completion_tokens,
          total: response.usage.total_tokens
        }
      })
    }

    return content
  } catch (error) {
    err(`Error in callGrok: ${(error as Error).message}`)
    throw error
  }
}
```

## Mistral

Install `@mistralai/mistralai` dependency.

```bash
npm i @mistralai/mistralai
```

Create `mistral.ts` file in `src/llms` and `mistral.test.ts` file in `test/models`.

```bash
echo '' > src/llms/mistral.ts
echo '' > test/models/mistral.test.ts
```

Add the following to `src/llms/mistral.ts`:

```ts
// src/llms/mistral.ts

import { env } from 'node:process'
import { Mistral } from '@mistralai/mistralai'
import { err } from '../utils/logging'
import { logLLMCost } from '../utils/step-utils/llm-utils'

/**
 * Available Mistral AI models.
 */
export type MistralModelType = 'MIXTRAL_8x7B' | 'MIXTRAL_8x22B' | 'MISTRAL_LARGE' | 'MISTRAL_SMALL' | 'MINISTRAL_8B' | 'MINISTRAL_3B' | 'MISTRAL_NEMO' | 'MISTRAL_7B'

/**
 * Configuration for Mistral AI models, mapping model types to their display names and identifiers.
 * Includes Mixtral, Mistral, and Ministral models with various parameter sizes and capabilities.
 */
export const MISTRAL_MODELS = {
  MIXTRAL_8x7B: { 
    name: 'Mixtral 8x7B', 
    modelId: 'open-mixtral-8x7b',
    inputCostPer1M: 0.70,
    outputCostPer1M: 0.70
  },
  MIXTRAL_8x22B: { 
    name: 'Mixtral 8x22B', 
    modelId: 'open-mixtral-8x22b',
    inputCostPer1M: 2.00,
    outputCostPer1M: 6.00
  },
  MISTRAL_LARGE: { 
    name: 'Mistral Large', 
    modelId: 'mistral-large-latest',
    inputCostPer1M: 2.00,
    outputCostPer1M: 6.00
  },
  MISTRAL_SMALL: { 
    name: 'Mistral Small', 
    modelId: 'mistral-small-latest',
    inputCostPer1M: 0.20,
    outputCostPer1M: 0.60
  },
  MINISTRAL_8B: { 
    name: 'Ministral 8B', 
    modelId: 'ministral-8b-latest',
    inputCostPer1M: 0.10,
    outputCostPer1M: 0.10
  },
  MINISTRAL_3B: { 
    name: 'Ministral 3B', 
    modelId: 'ministral-3b-latest',
    inputCostPer1M: 0.04,
    outputCostPer1M: 0.04
  },
  MISTRAL_NEMO: { 
    name: 'Mistral NeMo', 
    modelId: 'open-mistral-nemo',
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.15
  },
  MISTRAL_7B: { 
    name: 'Mistral 7B', 
    modelId: 'open-mistral-7b',
    inputCostPer1M: 0.25,
    outputCostPer1M: 0.25
  },
}

/**
 * Main function to call Mistral AI API.
 * @param {string} prompt - The prompt or instructions to process.
 * @param {string} transcript - The transcript text.
 * @param {string} [model] - The Mistral model to use.
 * @returns {Promise<string>} A Promise that resolves when the API call is complete.
 * @throws {Error} If an error occurs during the API call.
 */
export const callMistral = async (
  prompt: string,
  transcript: string,
  model: string = 'MISTRAL_NEMO'
) => {
  if (!env['MISTRAL_API_KEY']) {
    throw new Error('MISTRAL_API_KEY environment variable is not set. Please set it to your Mistral API key.')
  }

  const mistral = new Mistral({ apiKey: env['MISTRAL_API_KEY'] })
  
  try {
    const actualModel = (MISTRAL_MODELS[model as MistralModelType] || MISTRAL_MODELS.MISTRAL_NEMO).modelId
    const combinedPrompt = `${prompt}\n${transcript}`

    const response = await mistral.chat.complete({
      model: actualModel,
      messages: [{ role: 'user', content: combinedPrompt }],
    })

    if (!response.choices || response.choices.length === 0) {
      throw new Error("No choices returned from Mistral API")
    }

    const firstChoice = response.choices[0]
    if (!firstChoice?.message?.content) {
      throw new Error("Invalid response format from Mistral API")
    }

    const content = firstChoice.message.content
    const contentString = Array.isArray(content) ? content.join('') : content

    logLLMCost({
      modelName: actualModel,
      stopReason: firstChoice.finishReason ?? 'unknown',
      tokenUsage: {
        input: response.usage?.promptTokens,
        output: response.usage?.completionTokens,
        total: response.usage?.totalTokens
      }
    })
    
    return contentString
  } catch (error) {
    err(`Error in callMistral: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
}
```

Use Mistral default model or select a specific model:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --mistral
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --mistral MIXTRAL_8x7b
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --mistral MIXTRAL_8x22b
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --mistral MISTRAL_LARGE
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --mistral MISTRAL_NEMO
```

Include Mistral API key directly in CLI command instead of in `.env` file:

```bash
npm run as -- \
  --video "https://www.youtube.com/watch?v=MORMZXEaONk" \
  --mistral \
  --mistralApiKey ""
```

Add the following to `test/models/mistral.test.ts`:

```ts
// test/models/mistral.test.ts

import test from 'node:test'
import { strictEqual } from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'

const commands = [
  {
    // Process multiple YouTube videos from URLs with title prompts using default Mistral model
    cmd: 'npm run as -- --urls "content/example-urls.md" --prompt titles --whisper tiny --mistral',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-mistral-shownotes.md', newName: '01-mistral-default.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-mistral-shownotes.md', newName: '02-mistral-default.md' }
    ]
  },
  {
    // Process video with Mixtral 8x7B model
    cmd: 'npm run as -- --file "content/audio.mp3" --mistral MIXTRAL_8x7B',
    expectedFile: 'audio-mistral-shownotes.md',
    newName: '03-mistral-mixtral-8x7b.md'
  },
  {
    // Process video with Mixtral 8x22B model
    cmd: 'npm run as -- --file "content/audio.mp3" --mistral MIXTRAL_8x22B',
    expectedFile: 'audio-mistral-shownotes.md',
    newName: '04-mistral-mixtral-8x22b.md'
  },
  {
    // Process video with Mistral Large model
    cmd: 'npm run as -- --file "content/audio.mp3" --mistral MISTRAL_LARGE',
    expectedFile: 'audio-mistral-shownotes.md',
    newName: '05-mistral-large.md'
  },
  {
    // Process video with Mistral Small model
    cmd: 'npm run as -- --file "content/audio.mp3" --mistral MISTRAL_SMALL',
    expectedFile: 'audio-mistral-shownotes.md',
    newName: '06-mistral-small.md'
  },
  {
    // Process video with Ministral 8B model
    cmd: 'npm run as -- --file "content/audio.mp3" --mistral MINISTRAL_8B',
    expectedFile: 'audio-mistral-shownotes.md',
    newName: '07-mistral-ministral-8b.md'
  },
  {
    // Process video with Ministral 3B model
    cmd: 'npm run as -- --file "content/audio.mp3" --mistral MINISTRAL_3B',
    expectedFile: 'audio-mistral-shownotes.md',
    newName: '08-mistral-ministral-3b.md'
  },
  {
    // Process video with Mistral NeMo model
    cmd: 'npm run as -- --file "content/audio.mp3" --mistral MISTRAL_NEMO',
    expectedFile: 'audio-mistral-shownotes.md',
    newName: '09-mistral-nemo.md'
  },
  {
    // Process video with Mistral 7B model
    cmd: 'npm run as -- --file "content/audio.mp3" --mistral MISTRAL_7B',
    expectedFile: 'audio-mistral-shownotes.md',
    newName: '10-mistral-7b.md'
  }
]

test('AutoShow Mistral Command Tests', async (t) => {
  for (const [index, command] of commands.entries()) {
    await t.test(`should run command ${index + 1} successfully`, async () => {
      // Run the command
      execSync(command.cmd, { stdio: 'inherit' })
      
      if (Array.isArray(command.expectedFiles)) {
        for (const { file, newName } of command.expectedFiles) {
          const filePath = join('content', file)
          strictEqual(existsSync(filePath), true, `Expected file ${file} was not created`)
          const newPath = join('content', newName)
          renameSync(filePath, newPath)
          strictEqual(existsSync(newPath), true, `File was not renamed to ${newName}`)
        }
      } else {
        const filePath = join('content', command.expectedFile as string)
        strictEqual(existsSync(filePath), true, `Expected file ${command.expectedFile} was not created`)
        const newPath = join('content', command.newName as string)
        renameSync(filePath, newPath)
        strictEqual(existsSync(newPath), true, `File was not renamed to ${command.newName}`)
      }
    })
  }
})
```

Run `mistral.test.ts` test file:

```bash
npx tsx --test test/models/mistral.test.ts
```

## Cohere

Install `cohere-ai` dependency.

```bash
npm i cohere-ai
```

Create `cohere.ts` file in `src/llms` and `cohere.test.ts` file in `test/models`.

```bash
echo '' > src/llms/cohere.ts
echo '' > test/models/cohere.test.ts
```

Add the following to `src/llms/cohere.ts`:

```ts
// src/llms/cohere.ts

import { env } from 'node:process'
import { CohereClient } from 'cohere-ai'
import { err } from '../utils/logging'
import { logLLMCost } from '../utils/step-utils/llm-utils'

/**
 * Available Cohere models.
 */
export type CohereModelType = 'COMMAND_R' | 'COMMAND_R_PLUS'

/**
 * Configuration for Cohere models, mapping model types to their display names and identifiers.
 * Features Command models specialized for different tasks and performance levels.
 */
export const COHERE_MODELS = {
  COMMAND_R: { 
    name: 'Command R', 
    modelId: 'command-r',
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.60
  },
  COMMAND_R_PLUS: { 
    name: 'Command R Plus', 
    modelId: 'command-r-plus',
    inputCostPer1M: 2.50,
    outputCostPer1M: 10.00
  },
}

/**
 * Main function to call Cohere API.
 * @param {string} prompt - The prompt or instructions to process.
 * @param {string} transcript - The transcript text.
 * @param {string} [model] - The Cohere model to use.
 * @returns {Promise<string>} A Promise that resolves when the API call is complete.
 * @throws {Error} If an error occurs during the API call.
 */
export const callCohere = async (
  prompt: string,
  transcript: string,
  model: string = 'COMMAND_R'
) => {
  if (!env['COHERE_API_KEY']) {
    throw new Error('COHERE_API_KEY environment variable is not set. Please set it to your Cohere API key.')
  }
  
  const cohere = new CohereClient({ token: env['COHERE_API_KEY'] })
  
  try {
    const actualModel = (COHERE_MODELS[model as CohereModelType] || COHERE_MODELS.COMMAND_R).modelId
    const combinedPrompt = `${prompt}\n${transcript}`

    const response = await cohere.chat({
      model: actualModel,
      message: combinedPrompt
    })

    const {
      text,
      meta,
      finishReason
    } = response

    const { inputTokens, outputTokens } = meta?.tokens ?? {}

    logLLMCost({
      modelName: actualModel,
      stopReason: finishReason ?? 'unknown',
      tokenUsage: {
        input: inputTokens,
        output: outputTokens,
        total: inputTokens && outputTokens ? inputTokens + outputTokens : undefined
      }
    })

    return text
  } catch (error) {
    err(`Error in callCohere: ${(error as Error).message}`)
    throw error
  }
}
```

Use Cohere default model or select a specific model:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --cohere
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --cohere COMMAND_R
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --cohere COMMAND_R_PLUS
```

Include Cohere API key directly in CLI command instead of in `.env` file:

```bash
npm run as -- \
  --video "https://www.youtube.com/watch?v=MORMZXEaONk" \
  --cohere \
  --cohereApiKey ""
```

Add the following to `test/models/cohere.test.ts`:

```ts
// test/models/cohere.test.ts

import test from 'node:test'
import { strictEqual } from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'

const commands = [
  {
    // Process multiple YouTube videos from URLs with title prompts using default Cohere model
    cmd: 'npm run as -- --urls "content/example-urls.md" --prompt titles --whisper tiny --cohere',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-cohere-shownotes.md', newName: '01-cohere-default.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-cohere-shownotes.md', newName: '02-cohere-default.md' }
    ]
  },
  {
    // Process video with Cohere Command R model
    cmd: 'npm run as -- --file "content/audio.mp3" --cohere COMMAND_R',
    expectedFile: 'audio-cohere-shownotes.md',
    newName: '03-cohere-command-r.md'
  },
  {
    // Process video with Cohere Command R Plus model
    cmd: 'npm run as -- --file "content/audio.mp3" --cohere COMMAND_R_PLUS',
    expectedFile: 'audio-cohere-shownotes.md',
    newName: '04-cohere-command-r-plus.md'
  }
]

test('AutoShow Cohere Command Tests', async (t) => {
  for (const [index, command] of commands.entries()) {
    await t.test(`should run command ${index + 1} successfully`, async () => {
      // Run the command
      execSync(command.cmd, { stdio: 'inherit' })
      
      if (Array.isArray(command.expectedFiles)) {
        for (const { file, newName } of command.expectedFiles) {
          const filePath = join('content', file)
          strictEqual(existsSync(filePath), true, `Expected file ${file} was not created`)
          const newPath = join('content', newName)
          renameSync(filePath, newPath)
          strictEqual(existsSync(newPath), true, `File was not renamed to ${newName}`)
        }
      } else {
        const filePath = join('content', command.expectedFile as string)
        strictEqual(existsSync(filePath), true, `Expected file ${command.expectedFile} was not created`)
        const newPath = join('content', command.newName as string)
        renameSync(filePath, newPath)
        strictEqual(existsSync(newPath), true, `File was not renamed to ${command.newName}`)
      }
    })
  }
})
```

Run `cohere.test.ts` test file:

```bash
npx tsx --test test/models/cohere.test.ts
```

## Groq

Create `groq.ts` file in `src/llms` and `groq.test.ts` file in `test/models`.

```bash
echo '' > src/llms/groq.ts
echo '' > test/models/groq.test.ts
```

Add the following to `src/llms/groq.ts`:

```ts
// src/llms/groq.ts

import { env } from 'node:process'
import { err } from '../utils/logging'
import { logLLMCost } from '../utils/step-utils/llm-utils'

/**
 * Available Groq models.
 */
export type GroqModelType = 'LLAMA_3_2_1B_PREVIEW' | 'LLAMA_3_2_3B_PREVIEW' | 'LLAMA_3_3_70B_VERSATILE' | 'LLAMA_3_1_8B_INSTANT' | 'MIXTRAL_8X7B_INSTRUCT'

/**
 * Configuration for Groq models, mapping model types to their display names and identifiers.
 * Features optimized versions of LLaMA, Mixtral, and Gemma models for high-performance inference.
 */
export const GROQ_MODELS = {
  LLAMA_3_2_1B_PREVIEW: { 
    name: 'Llama 3.2 1B (Preview) 8k', 
    modelId: 'llama-3.2-1b-preview',
    inputCostPer1M: 0.04,
    outputCostPer1M: 0.04
  },
  LLAMA_3_2_3B_PREVIEW: { 
    name: 'Llama 3.2 3B (Preview) 8k', 
    modelId: 'llama-3.2-3b-preview',
    inputCostPer1M: 0.06,
    outputCostPer1M: 0.06
  },
  LLAMA_3_3_70B_VERSATILE: { 
    name: 'Llama 3.3 70B Versatile 128k', 
    modelId: 'llama-3.3-70b-versatile',
    inputCostPer1M: 0.59,
    outputCostPer1M: 0.79
  },
  LLAMA_3_1_8B_INSTANT: { 
    name: 'Llama 3.1 8B Instant 128k', 
    modelId: 'llama-3.1-8b-instant',
    inputCostPer1M: 0.05,
    outputCostPer1M: 0.08
  },
  MIXTRAL_8X7B_INSTRUCT: { 
    name: 'Mixtral 8x7B Instruct 32k', 
    modelId: 'mixtral-8x7b-32768',
    inputCostPer1M: 0.24,
    outputCostPer1M: 0.24
  },
}

/**
 * Function to call the Groq chat completion API.
 * @param {string} prompt - The prompt or instructions to process.
 * @param {string} transcript - The transcript text.
 * @param {string | GroqModelType} [model] - The model to use.
 * @returns {Promise<string>} A Promise that resolves when the API call is complete.
 * @throws {Error} If an error occurs during the API call.
 */
export const callGroq = async (
  prompt: string,
  transcript: string,
  model: string | GroqModelType = 'LLAMA_3_2_1B_PREVIEW'
) => {
  if (!env['GROQ_API_KEY']) {
    throw new Error('GROQ_API_KEY environment variable is not set. Please set it to your Groq API key.')
  }

  try {
    const modelKey = typeof model === 'string' ? model : 'LLAMA_3_2_1B_PREVIEW'
    const modelConfig = GROQ_MODELS[modelKey as GroqModelType] || GROQ_MODELS.LLAMA_3_2_1B_PREVIEW
    const modelId = modelConfig.modelId

    const combinedPrompt = `${prompt}\n${transcript}`
    const requestBody = {
      model: modelId,
      messages: [
        {
          role: 'user',
          content: combinedPrompt,
        },
      ],
    }

    const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env['GROQ_API_KEY']}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Groq API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content generated from the Groq API')
    }

    logLLMCost({
      modelName: modelKey,
      stopReason: data.choices[0]?.finish_reason ?? 'unknown',
      tokenUsage: {
        input: data.usage?.prompt_tokens,
        output: data.usage?.completion_tokens,
        total: data.usage?.total_tokens
      }
    })

    return content
  } catch (error) {
    err(`Error in callGroq: ${(error as Error).message}`)
    throw error
  }
}
```

Use Groq default model or select a specific model:

```bash
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --groq
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --groq LLAMA_3_1_70B_VERSATILE
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --groq LLAMA_3_1_8B_INSTANT
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --groq LLAMA_3_2_1B_PREVIEW
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --groq LLAMA_3_2_3B_PREVIEW
npm run as -- --video "https://www.youtube.com/watch?v=MORMZXEaONk" --groq MIXTRAL_8X7B_32768
```

Include Groq API key directly in CLI command instead of in `.env` file:

```bash
npm run as -- \
  --video "https://www.youtube.com/watch?v=MORMZXEaONk" \
  --groq \
  --groqApiKey ""
```

Add the following to `test/models/groq.test.ts`:

```ts
// test/models/groq.test.ts

import test from 'node:test'
import { strictEqual } from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'

const commands = [
  {
    // Process multiple YouTube videos from URLs with title prompts using default Groq model
    cmd: 'npm run as -- --urls "content/example-urls.md" --prompt titles --whisper tiny --groq',
    expectedFiles: [
      { file: '2024-09-24-ep1-fsjam-podcast-groq-shownotes.md', newName: '01-groq-default.md' },
      { file: '2024-09-24-ep0-fsjam-podcast-groq-shownotes.md', newName: '02-groq-default.md' }
    ]
  },
  {
    // Process video with Llama 3.2 1B Preview model
    cmd: 'npm run as -- --file "content/audio.mp3" --groq LLAMA_3_2_1B_PREVIEW',
    expectedFile: 'audio-groq-shownotes.md',
    newName: '03-groq-llama-3-2-1b-preview.md'
  },
  {
    // Process video with Llama 3.2 3B Preview model
    cmd: 'npm run as -- --file "content/audio.mp3" --groq LLAMA_3_2_3B_PREVIEW',
    expectedFile: 'audio-groq-shownotes.md',
    newName: '04-groq-llama-3-2-3b-preview.md'
  },
  {
    // Process video with Llama 3.3 70B Versatile model
    cmd: 'npm run as -- --file "content/audio.mp3" --groq LLAMA_3_3_70B_VERSATILE',
    expectedFile: 'audio-groq-shownotes.md',
    newName: '05-groq-llama-3-3-70b-versatile.md'
  },
  {
    // Process video with Llama 3.1 8B Instant model
    cmd: 'npm run as -- --file "content/audio.mp3" --groq LLAMA_3_1_8B_INSTANT',
    expectedFile: 'audio-groq-shownotes.md',
    newName: '06-groq-llama-3-1-8b-instant.md'
  },
  {
    // Process video with Mixtral 8x7B Instruct model
    cmd: 'npm run as -- --file "content/audio.mp3" --groq MIXTRAL_8X7B_INSTRUCT',
    expectedFile: 'audio-groq-shownotes.md',
    newName: '07-groq-mixtral-8x7b-instruct.md'
  },
]

test('AutoShow Groq Command Tests', async (t) => {
  for (const [index, command] of commands.entries()) {
    await t.test(`should run command ${index + 1} successfully`, async () => {
      // Run the command
      execSync(command.cmd, { stdio: 'inherit' })
      
      if (Array.isArray(command.expectedFiles)) {
        for (const { file, newName } of command.expectedFiles) {
          const filePath = join('content', file)
          strictEqual(existsSync(filePath), true, `Expected file ${file} was not created`)
          const newPath = join('content', newName)
          renameSync(filePath, newPath)
          strictEqual(existsSync(newPath), true, `File was not renamed to ${newName}`)
        }
      } else {
        const filePath = join('content', command.expectedFile as string)
        strictEqual(existsSync(filePath), true, `Expected file ${command.expectedFile} was not created`)
        const newPath = join('content', command.newName as string)
        renameSync(filePath, newPath)
        strictEqual(existsSync(newPath), true, `File was not renamed to ${command.newName}`)
      }
    })
  }
})
```

Run `groq.test.ts` test file:

```bash
npx tsx --test test/models/groq.test.ts
```