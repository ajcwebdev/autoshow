// src/server/run-llm.ts

import { dbService } from '../db.ts'
import { l, err, logInitialFunctionCall } from '../utils/logging.ts'
import { readFile, writeFile } from '../utils/node-utils.ts'
import { L_CONFIG } from '../../shared/constants.ts'
import { callChatGPT, callClaude, callGemini, callDeepSeek, callFireworks, callTogether } from '../llms/llm-services.ts'
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { ProcessingOptions, ShowNoteMetadata, LLMResult, RunLLMBody, ChatGPTModelValue, ClaudeModelValue, GeminiModelValue, DeepSeekModelValue, FireworksModelValue, TogetherModelValue } from '../../shared/types.ts'

export async function runLLM(
  options: ProcessingOptions,
  finalPath: string,
  frontMatter: string,
  prompt: string,
  transcript: string,
  metadata: ShowNoteMetadata,
  llmServices?: string,
  transcriptionServices?: string,
  transcriptionModel?: string,
  transcriptionCost?: number
) {
  l.step(`\nStep 5 - Run Language Model\n`)
  logInitialFunctionCall('runLLM', { llmServices, metadata })
  metadata.walletAddress = options['walletAddress'] || metadata.walletAddress
  metadata.mnemonic = options['mnemonic'] || metadata.mnemonic
  try {
    let showNotesResult = ''
    let userModel = ''
    const numericLLMCost = Number(options.llmCost) || 0
    if (llmServices) {
      l.dim(`\n  Preparing to process with '${llmServices}' Language Model...\n`)
      const config = L_CONFIG[llmServices as keyof typeof L_CONFIG]
      if (!config) {
        throw new Error(`Unknown LLM service: ${llmServices}`)
      }
      const optionValue = options[llmServices as keyof typeof options]
      const defaultModelId = config.models[0]?.modelId ?? ''
      userModel = (typeof optionValue === 'string' && optionValue !== 'true' && optionValue.trim() !== '')
        ? optionValue
        : defaultModelId
      let showNotesData: LLMResult
      switch (llmServices) {
        case 'chatgpt':
          showNotesData = await retryLLMCall(() => callChatGPT(prompt,transcript,userModel as ChatGPTModelValue))
          break
        case 'claude':
          showNotesData = await retryLLMCall(() => callClaude(prompt,transcript,userModel as ClaudeModelValue))
          break
        case 'gemini':
          showNotesData = await retryLLMCall(() => callGemini(prompt,transcript,userModel as GeminiModelValue))
          break
        case 'deepseek':
          showNotesData = await retryLLMCall(() => callDeepSeek(prompt,transcript,userModel as DeepSeekModelValue))
          break
        case 'fireworks':
          showNotesData = await retryLLMCall(() => callFireworks(prompt,transcript,userModel as FireworksModelValue))
          break
        case 'together':
          showNotesData = await retryLLMCall(() => callTogether(prompt,transcript,userModel as TogetherModelValue))
          break
        default:
          throw new Error(`Unknown LLM service: ${llmServices}`)
      }
      const showNotes = showNotesData.content
      const outputFilename = `${finalPath}-${llmServices}-shownotes.md`
      await writeFile(outputFilename, `${frontMatter}\n${showNotes}\n\n## Transcript\n\n${transcript}`)
      l.dim(`\n  LLM processing completed, combined front matter + LLM output + transcript written to:\n    - ${outputFilename}`)
      showNotesResult = showNotes
    } else {
      l.dim('  No LLM selected, skipping processing...')
      const noLLMFile = `${finalPath}-prompt.md`
      l.dim(`\n  Writing front matter + prompt + transcript to file:\n    - ${noLLMFile}`)
      await writeFile(noLLMFile, `${frontMatter}\n${prompt}\n## Transcript\n\n${transcript}`)
    }
    const finalCost = (transcriptionCost || 0) + numericLLMCost
    let insertedNote = {
      showLink: metadata.showLink ?? '',
      channel: metadata.channel ?? '',
      channelURL: metadata.channelURL ?? '',
      title: metadata.title,
      description: metadata.description ?? '',
      publishDate: metadata.publishDate,
      coverImage: metadata.coverImage ?? '',
      frontmatter: frontMatter,
      prompt,
      transcript,
      llmOutput: showNotesResult,
      walletAddress: metadata.walletAddress ?? '',
      mnemonic: metadata.mnemonic ?? '',
      llmService: llmServices ?? '',
      llmModel: userModel,
      llmCost: numericLLMCost,
      transcriptionService: transcriptionServices ?? '',
      transcriptionModel: transcriptionModel ?? '',
      transcriptionCost,
      finalCost
    }
    const newRecord = await dbService.insertShowNote(insertedNote)
    return { showNote: newRecord, showNotesResult }
  } catch (error) {
    err(`Error running Language Model: ${(error as Error).message}`)
    throw error
  }
}

export async function retryLLMCall(fn: () => Promise<any>) {
  const maxRetries = 7
  let attempt = 0
  while (attempt < maxRetries) {
    try {
      attempt++
      l.dim(`  Attempt ${attempt} - Processing LLM call...\n`)
      const result = await fn()
      l.dim(`\n  LLM call completed successfully on attempt ${attempt}.`)
      return result
    } catch (error) {
      err(`  Attempt ${attempt} failed: ${(error as Error).message}`)
      if (attempt >= maxRetries) {
        err(`  Max retries (${maxRetries}) reached. Aborting LLM processing.`)
        throw error
      }
      const delayMs = 1000 * 2 ** (attempt - 1)
      l.dim(`  Retrying in ${delayMs / 1000} seconds...`)
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
  throw new Error('LLM call failed after maximum retries.')
}

export async function handleRunLLM(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as RunLLMBody
  const filePath = body.filePath
  const llmServices = body.llmServices
  const options = body.options || {}
  const transcriptionServices = options['transcriptionServices']
  const transcriptionModel = options['transcriptionModel']
  const transcriptionCost = options['transcriptionCost']
  const metaFromBody = options['metadata']
  if (!filePath) {
    reply.status(400).send({ error: 'filePath is required' })
    return
  }
  try {
    const raw = await readFile(filePath, 'utf8')
    const lines = raw.split('\n')
    let frontMatterLines = []
    let i = 0
    if (lines[0]?.trim() === '---') {
      i = 1
      while (i < lines.length && lines[i]?.trim() !== '---') {
        frontMatterLines.push(lines[i])
        i++
      }
      i++
    }
    const frontMatter = `---\n${frontMatterLines.join('\n')}\n---`
    const rest = lines.slice(i).join('\n')
    const restLines = rest.split('\n')
    const transcriptIndex = restLines.findIndex(l => l.trim() === '## Transcript')
    let prompt = ''
    let transcript = ''
    if (transcriptIndex > -1) {
      prompt = restLines.slice(0, transcriptIndex).join('\n').trim()
      transcript = restLines.slice(transcriptIndex + 1).join('\n').trim()
    }
    const metadata: ShowNoteMetadata = {
      showLink: '',
      channel: '',
      channelURL: '',
      title: '',
      description: '',
      publishDate: '',
      coverImage: '',
      walletAddress: '',
      mnemonic: ''
    }
    frontMatterLines.forEach(line => {
      if (line) {
        const m = line.match(/^(\w+):\s*"(.*?)"$/)
        if (m && m[1]) {
          const key = m[1]
          const val = m[2] || ''
          if (Object.hasOwn(metadata, key)) {
            metadata[key as keyof ShowNoteMetadata] = val
          }
        }
      }
    })
    if (metaFromBody) {
      Object.assign(metadata, metaFromBody)
    }
    const result = await runLLM(
      options,
      filePath.replace(/\.[^/.]+$/, ''),
      frontMatter,
      prompt,
      transcript,
      metadata,
      llmServices,
      transcriptionServices,
      transcriptionModel,
      transcriptionCost
    )
    reply.send(result)
  } catch (error) {
    reply.status(500).send({ error: (error as Error).message })
  }
}