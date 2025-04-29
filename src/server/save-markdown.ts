// src/server/save-markdown.ts

import { writeFile, join } from '../utils.ts'
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { SaveMarkdownRequest } from '../../shared/types.ts'

export async function handleSaveMarkdown(request: FastifyRequest<{Body: SaveMarkdownRequest}>, reply: FastifyReply) {
  try {
    const { frontMatter, prompt, transcript, finalPath } = request.body
    if (!frontMatter || !transcript || !finalPath) {
      reply.status(400).send({ error: 'frontMatter, transcript, and finalPath are required' })
      return
    }
    const content = `${frontMatter}\n${prompt ? prompt + '\n' : ''}## Transcript\n\n${transcript}`
    const markdownFilePath = `${finalPath}.md`
    await writeFile(join(process.cwd(), `${markdownFilePath}`), content, 'utf8')
    reply.send({ markdownFilePath })
  } catch (error) {
    reply.status(500).send({ error: (error as Error).message })
  }
}