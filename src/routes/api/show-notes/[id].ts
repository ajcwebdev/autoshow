// src/routes/api/show-notes/[id].ts

/**
 * Handler for retrieving a single show note by ID from the database.
 * Returns the show note data or a 404 if not found.
 *
 * @param event - APIEvent object for the incoming request
 * @returns A Promise that resolves to a Response
 */

'use server'

import type { APIEvent } from '@solidjs/start/server'
import { db } from '../../../db'

export async function GET(event: APIEvent): Promise<Response> {
  try {
    const { id } = event.params as { id: string }
    const showNote = db.prepare(`SELECT * FROM show_notes WHERE id = ?`).get(id)
    if (showNote) {
      return new Response(JSON.stringify({ showNote }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    } else {
      return new Response(JSON.stringify({ error: 'Show note not found' }), { status: 404 })
    }
  } catch (error) {
    console.error('Error fetching show note:', error)
    return new Response(JSON.stringify({ error: 'An error occurred while fetching the show note' }), { status: 500 })
  }
}