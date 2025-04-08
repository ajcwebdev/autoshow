// src/server/show-notes.ts

import { dbService } from '../db.ts'
import type { FastifyRequest, FastifyReply } from 'fastify'

export const getShowNotes = async (_request: FastifyRequest, reply: FastifyReply) => {
  try {
    const showNotes = await dbService.getShowNotes()
    reply.send({ showNotes })
  } catch (error) {
    console.error('Error fetching show notes:', error)
    reply.status(500).send({ error: 'An error occurred while fetching show notes' })
  }
}