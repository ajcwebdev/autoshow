// packages/server/routes/showNotes.ts

import { db } from '../db'

export const getShowNotes = async (request, reply) => {
  try {
    // Fetch all show notes from the database
    const showNotes = db.prepare(`SELECT * FROM show_notes ORDER BY date DESC`).all()
    reply.send({ showNotes })
  } catch (error) {
    console.error('Error fetching show notes:', error)
    reply.status(500).send({ error: 'An error occurred while fetching show notes' })
  }
}