// src/pages/api/show-notes/[id].ts

import type { APIRoute } from "astro"
import { s3Service } from "../../../services/s3"
import { l, err } from '../../../utils'

export const GET: APIRoute = async ({ params, request }) => {
  const pre = "[api/show-notes/[id]]"
  const url = new URL(request.url)
  l(`${pre} GET request started: ${url.pathname}`)
  
  try {
    const id = params.id
    l(`${pre} Processing request for show note ID: ${id}`)
    
    if (!id) {
      err(`${pre} Missing ID parameter`)
      return new Response(JSON.stringify({ error: 'id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    l(`${pre} Fetching show note with ID: ${id}`)
    const showNote = await s3Service.getShowNote(id)
    
    if (showNote) {
      l(`${pre} Successfully retrieved show note: ${id}`)
      l(`${pre} Show note title: ${showNote.title}`)
      
      return new Response(JSON.stringify({ showNote }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    } else {
      l(`${pre} Show note not found: ${id}`)
      return new Response(JSON.stringify({ error: 'Show note not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  } catch (error) {
    err(`${pre} Error fetching show note:`, error)
    err(`${pre} Error stack:`, error instanceof Error ? error.stack : 'No stack trace')
    
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