// web/src/pages/api/show-notes.ts

import type { APIRoute } from "astro"
import { dbService } from "../../db.ts"

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url)
  console.log(`[api/show-notes] GET request started: ${url.pathname}`)
  
  try {
    console.log("[api/show-notes] Fetching all show notes")
    
    if (!dbService) {
      console.error("[api/show-notes] Database service is not available")
      return new Response(JSON.stringify({ error: 'Database service is not available' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    const showNotes = await dbService.getShowNotes()
    console.log(`[api/show-notes] Successfully retrieved ${showNotes.length} show notes`)
    
    return new Response(JSON.stringify({ showNotes }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error(`[api/show-notes] Error fetching show notes: ${error}`)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return new Response(JSON.stringify({ error: `An error occurred while fetching show notes: ${errorMessage}` }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}