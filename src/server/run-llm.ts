// src/server/run-llm.ts

import { runLLM } from '../process-steps/05-run-llm.ts'
import { readFile } from '../utils/node-utils.ts'
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { ProcessingOptions, ShowNoteMetadata } from '../../shared/types.ts'

export async function handleRunLLM(request: FastifyRequest, reply: FastifyReply) {
  type RunLLMBody = {
    filePath?: string
    llmServices?: string
    options?: ProcessingOptions
  }

  const body = request.body as RunLLMBody
  const filePath = body.filePath
  const llmServices = body.llmServices
  const options = body.options || {}
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
    const metadata: ShowNoteMetadata = { title: '', publishDate: '' }
    const finalPath = filePath.replace(/\.[^/.]+$/, '')
    const result = await runLLM(options, finalPath, frontMatter, prompt, transcript, metadata, llmServices)
    reply.send(result)
  } catch (error) {
    reply.status(500).send({ error: (error as Error).message })
  }
}
