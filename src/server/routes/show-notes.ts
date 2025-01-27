// src/server/routes/show-notes.ts

import { db } from '../db'
import type { FastifyRequest, FastifyReply } from 'fastify'

export const getShowNotes = async (_request: FastifyRequest, reply: FastifyReply) => {
  try {
    // Fetch all show notes from the database
    const showNotes = db.prepare(`SELECT * FROM show_notes ORDER BY publishDate DESC`).all()
    reply.send({ showNotes })
  } catch (error) {
    console.error('Error fetching show notes:', error)
    reply.status(500).send({ error: 'An error occurred while fetching show notes' })
  }
}