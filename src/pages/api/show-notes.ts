// src/pages/api/show-notes.ts

import type { APIRoute } from "astro"
import { dbService } from "../../db"
import { l, err } from '../../utils'

export const GET: APIRoute = async ({ request }) => {
  const pre = "[api/show-notes]"
  const url = new URL(request.url)
  l(`${pre} GET request started: ${url.pathname}`)
  
  try {
    l(`${pre} Fetching all show notes`)
    
    if (!dbService) {
      err(`${pre} Database service is not available`)
      return new Response(JSON.stringify({ error: 'Database service is not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    l(`${pre} Calling dbService.getShowNotes()...`)
    const showNotes = await dbService.getShowNotes()
    
    l(`${pre} Successfully retrieved ${showNotes.length} show notes`)
    l(`${pre} First few titles:`, showNotes.slice(0, 3).map(n => n.title))
    
    return new Response(JSON.stringify({ showNotes }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    err(`${pre} Error fetching show notes:`, error)
    err(`${pre} Error stack:`, error instanceof Error ? error.stack : 'No stack trace')
    
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