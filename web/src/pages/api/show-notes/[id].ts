// web/src/pages/api/show-notes/[id].ts

import type { APIRoute } from "astro"
import { dbService } from "../../../../../src/db.ts"

export const GET: APIRoute = async ({ params }) => {
  console.log("[api/show-notes/[id]] GET request started")
  try {
    const id = params.id
    console.log(`[api/show-notes/[id]] id: ${id}`)
    
    if (!id) {
      console.error("[api/show-notes/[id]] Missing id")
      return new Response(JSON.stringify({ error: 'id is required' }), { status: 400 })
    }
    
    const showNote = await dbService.getShowNote(Number(id))
    if (showNote) {
      return new Response(JSON.stringify({ showNote }), { status: 200 })
    } else {
      return new Response(JSON.stringify({ error: 'Show note not found' }), { status: 404 })
    }
  } catch (error) {
    console.error(`[api/show-notes/[id]] Caught error: ${error}`)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return new Response(JSON.stringify({ error: `An error occurred while fetching the show note: ${errorMessage}` }), { status: 500 })
  }
}