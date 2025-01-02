// web/src/pages/api/show-notes/[id].ts

import type { APIRoute } from 'astro'
import { db, ShowNote, eq } from 'astro:db'

// GET /api/show-notes/:id
export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params
    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing id parameter' }), { status: 400 })
    }

    // Drizzle-based query: select by primary key = id
    const [showNote] = await db
      .select()
      .from(ShowNote)
      .where(eq(ShowNote.id, parseInt(id, 10)))

    if (!showNote) {
      return new Response(JSON.stringify({ error: 'Show note not found' }), { status: 404 })
    }

    return new Response(JSON.stringify({ showNote }), { status: 200 })
  } catch (error) {
    console.error('Error fetching show note:', error)
    return new Response(
      JSON.stringify({ error: 'An error occurred while fetching the show note' }),
      { status: 500 }
    )
  }
}