// src/pages/api/show-notes/[id].ts

import type { APIRoute } from "astro"
import { dbService } from "../../../db"

export const GET: APIRoute = async ({ params, request }) => {
  const url = new URL(request.url)
  console.log(`[api/show-notes/[id]] GET request started: ${url.pathname}`)
  
  try {
    const id = params.id
    console.log(`[api/show-notes/[id]] Processing request for show note ID: ${id}`)
    
    if (!id) {
      console.error("[api/show-notes/[id]] Missing ID parameter")
      return new Response(JSON.stringify({ error: 'id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    const numericId = Number(id)
    console.log(`[api/show-notes/[id]] Parsed ID: ${numericId}`)
    
    if (isNaN(numericId)) {
      console.error(`[api/show-notes/[id]] Invalid ID format: ${id}`)
      return new Response(JSON.stringify({ error: 'id must be a valid number' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    console.log(`[api/show-notes/[id]] Fetching show note with ID: ${numericId}`)
    const showNote = await dbService.getShowNote(numericId)
    
    if (showNote) {
      console.log(`[api/show-notes/[id]] Successfully retrieved show note: ${numericId}`)
      console.log(`[api/show-notes/[id]] Show note title: ${showNote.title}`)
      
      return new Response(JSON.stringify({ showNote }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    } else {
      console.log(`[api/show-notes/[id]] Show note not found: ${numericId}`)
      return new Response(JSON.stringify({ error: 'Show note not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  } catch (error) {
    console.error(`[api/show-notes/[id]] Error fetching show note:`, error)
    console.error(`[api/show-notes/[id]] Error stack:`, error instanceof Error ? error.stack : 'No stack trace')
    
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return new Response(JSON.stringify({ 
      error: `An error occurred while fetching the show note: ${errorMessage}`,
      details: error instanceof Error ? error.stack : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}