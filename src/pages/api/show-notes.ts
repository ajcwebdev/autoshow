// src/pages/api/show-notes.ts

import type { APIRoute } from "astro"
import { dbService } from "../../db"

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
    
    console.log("[api/show-notes] Calling dbService.getShowNotes()...")
    const showNotes = await dbService.getShowNotes()
    
    console.log(`[api/show-notes] Successfully retrieved ${showNotes.length} show notes`)
    console.log(`[api/show-notes] First few titles:`, showNotes.slice(0, 3).map(n => n.title))
    
    return new Response(JSON.stringify({ showNotes }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error(`[api/show-notes] Error fetching show notes:`, error)
    console.error(`[api/show-notes] Error stack:`, error instanceof Error ? error.stack : 'No stack trace')
    
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return new Response(JSON.stringify({ 
      error: `An error occurred while fetching show notes: ${errorMessage}`,
      details: error instanceof Error ? error.stack : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}