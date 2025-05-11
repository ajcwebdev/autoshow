// src/components/ShowNote.tsx

import { createSignal, onMount } from 'solid-js'
import type { ShowNoteType } from '../types.ts'
const l = console.log
export function ShowNote() {
  const [showNote, setShowNote] = createSignal<ShowNoteType | null>(null)
  l('[ShowNote] Component initializing')
  onMount(() => {
    const id = window.location.pathname.split('/').pop()
    l(`[ShowNote] Fetching show note with ID: ${id}`)
    fetch(`http://localhost:4321/api/show-notes/${id}`)
      .then((response) => {
        l(`[ShowNote] Received response for show note ${id}`)
        return response.json()
      })
      .then((data) => {
        l(`[ShowNote] Successfully loaded show note: ${data.showNote?.title}`)
        setShowNote(data.showNote)
      })
      .catch((error) => {
        console.error(`[ShowNote] Error fetching show note ${id}:`, error)
      })
  })
  const formatContent = (text: string) => {
    return text.split('\n').map((line: string, _index: number) => (
      <>
        {line}
        <br />
      </>
    ))
  }
  l(`[ShowNote] Rendering show note component, loaded: ${!!showNote()}`)
  return (
    <div class="bg-card rounded-lg p-6 max-w-4xl mx-auto">
      {showNote() ? (
        <div class="markdown-content space-y-6">
          <h2 class="h2 text-primary-400">{showNote()!.title}</h2>
          <p class="text-muted-foreground">Date: {showNote()!.publishDate}</p>
          <section>
            <h3 class="h3 mb-3">LLM Output</h3>
            <div class="bg-base-800 p-4 rounded-md whitespace-pre-wrap">
              {showNote()!.llmOutput && formatContent(showNote()!.llmOutput || '')}
            </div>
          </section>
          <section>
            <h3 class="h3 mb-3">Front Matter</h3>
            <div class="bg-base-800 p-4 rounded-md whitespace-pre-wrap">
              {showNote()!.frontmatter && formatContent(showNote()!.frontmatter || '')}
            </div>
          </section>
          <section>
            <h3 class="h3 mb-3">Transcript</h3>
            <div class="bg-base-800 p-4 rounded-md whitespace-pre-wrap">
              {showNote()!.transcript ? formatContent(showNote()!.transcript || '') : 'No transcript available.'}
            </div>
          </section>
          <section>
            <h3 class="h3 mb-3">Prompt</h3>
            <div class="bg-base-800 p-4 rounded-md whitespace-pre-wrap">
              {showNote()!.prompt && formatContent(showNote()!.prompt || '')}
            </div>
          </section>
        </div>
      ) : (
        <div class="text-center text-muted-foreground">Loading...</div>
      )}
    </div>
  )
}