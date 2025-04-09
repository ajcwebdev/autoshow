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