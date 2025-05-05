// src/components/ShowNotes.tsx

import { createSignal, onMount, createEffect } from 'solid-js'
import type { ShowNoteType } from '../types.ts'

export function ShowNotes(props: { refreshCount: number }) {
  const [showNotes, setShowNotes] = createSignal<ShowNoteType[]>([])
  
  const fetchShowNotes = async () => {
    try {
      const response = await fetch('http://localhost:4321/api/show-notes')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setShowNotes(data.showNotes)
    } catch (error) {
      console.error('Error fetching show notes:', error)
    }
  }
  
  createEffect(() => {
    if (props.refreshCount) {
      fetchShowNotes()
    }
  })
  
  onMount(() => {
    fetchShowNotes()
  })
  
  return (
    <ul class="show-notes-list">
      <h1>Show Notes</h1>
      {showNotes().map((note) => (
        <li>
          <a href={`/show-notes/${note.id}`}>{note.title}</a> - {note.publishDate}
        </li>
      ))}
    </ul>
  )
}