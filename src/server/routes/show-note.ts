// src/server/routes/show-note.ts

import { db } from '../db'
import type { FastifyRequest, FastifyReply } from 'fastify'

export const getShowNote = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string }
    // Fetch the show note from the database
    const showNote = db.prepare(`SELECT * FROM show_notes WHERE id = ?`).get(id)
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