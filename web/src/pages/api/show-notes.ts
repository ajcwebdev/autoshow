// web/src/pages/api/show-notes.ts

import type { APIRoute } from "astro"
import { dbService } from "../../../../src/db.ts"

export const GET: APIRoute = async () => {
  console.log("[api/show-notes] GET request started")
  try {
    const showNotes = await dbService.getShowNotes()
    return new Response(JSON.stringify({ showNotes }), { status: 200 })
  } catch (error) {
    console.error(`[api/show-notes] Caught error: ${error}`)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return new Response(JSON.stringify({ error: `An error occurred while fetching show notes: ${errorMessage}` }), { status: 500 })
  }
}