// src/components/ShowNotes.tsx

import { createSignal, onMount, createEffect } from 'solid-js'
import type { ShowNoteType } from '../types.ts'
const l = console.log
export function ShowNotes(props: { refreshCount: number }) {
  const [showNotes, setShowNotes] = createSignal<ShowNoteType[]>([])
  l('[ShowNotes] Component initializing')
  const fetchShowNotes = async (): Promise<void> => {
    l('[ShowNotes] Fetching all show notes')
    try {
      const response = await fetch('http://localhost:4321/api/show-notes')
      if (!response.ok) {
        l(`[ShowNotes] HTTP error when fetching notes: status ${response.status}`)
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      l(`[ShowNotes] Successfully fetched ${data.showNotes.length} show notes`)
      setShowNotes(data.showNotes)
    } catch (error) {
      console.error('[ShowNotes] Error fetching show notes:', error)
    }
  }
  createEffect(() => {
    if (props.refreshCount) {
      l(`[ShowNotes] Refresh triggered due to refreshCount change: ${props.refreshCount}`)
      fetchShowNotes()
    }
  })
  onMount(() => {
    l('[ShowNotes] Component mounted, fetching initial show notes')
    fetchShowNotes()
  })
  l(`[ShowNotes] Rendering with ${showNotes().length} show notes`)
  return (
    <div class="bg-card rounded-lg p-6">
      <h1 class="h1 mb-6">Show Notes</h1>
      <ul class="space-y-3">
        {showNotes().map((note) => (
          <li class="border-b border-border pb-3 last:border-b-0">
            <a 
              href={`/show-notes/${note.id}`} 
              class="text-primary-400 hover:text-primary-300 transition-colors"
            >
              {note.title}
            </a>
            <span class="text-muted-foreground ml-3"> - {note.publishDate}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}