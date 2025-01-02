// web/src/pages/api/show-notes.ts

import type { APIRoute } from 'astro'
import { db, ShowNote, desc } from 'astro:db'

export const GET: APIRoute = async () => {
  try {
    // Drizzle-based query: select all, order by publishDate DESC
    const showNotes = await db
      .select()
      .from(ShowNote)
      // If your column is `publishDate`, do:
      .orderBy(desc(ShowNote.publishDate))

    return new Response(JSON.stringify({ showNotes }), { status: 200 })
  } catch (error) {
    console.error('Error fetching show notes:', error)
    return new Response(JSON.stringify({ error: 'Error fetching show notes' }), { status: 500 })
  }
}