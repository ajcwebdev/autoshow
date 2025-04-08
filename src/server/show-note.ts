// src/server/show-note.ts

import { dbService } from '../db.ts'
import type { FastifyRequest, FastifyReply } from 'fastify'

export const getShowNote = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string }
    const showNote = await dbService.getShowNote(Number(id))
    if (showNote) {
      reply.send({ showNote })
    } else {
      reply.status(404).send({ error: 'Show note not found' })
    }
  } catch (error) {
    console.error('Error fetching show note:', error)
    reply.status(500).send({ error: 'An error occurred while fetching the show note' })
  }
}