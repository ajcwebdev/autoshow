// web/src/components/ShowNote.tsx

import { createSignal, onMount } from 'solid-js'
import type { ShowNoteType } from '../types.ts'

export function ShowNote() {
  const [showNote, setShowNote] = createSignal<ShowNoteType | null>(null)
  
  onMount(() => {
    const id = window.location.pathname.split('/').pop()
    fetch(`http://localhost:4321/api/show-notes/${id}`)
      .then((response) => response.json())
      .then((data) => {
        setShowNote(data.showNote)
      })
      .catch((error) => {
        console.error('Error fetching show note:', error)
      })
  })
  
  const formatContent = (text: string) => {
    return text.split('\n').map((line: string, index: number) => (
      <>
        {line}
        <br />
      </>
    ))
  }
  
  return (
    <div class="show-note">
      {showNote() ? (
        <>
          <h2>{showNote()!.title}</h2>
          <p>Date: {showNote()!.publishDate}</p>
          <h3>LLM Output</h3>
          <div>{showNote()!.llmOutput && formatContent(showNote()!.llmOutput || '')}</div>
          <h3>Front Matter</h3>
          <div>{showNote()!.frontmatter && formatContent(showNote()!.frontmatter || '')}</div>
          <h3>Transcript</h3>
          <div>{showNote()!.transcript ? formatContent(showNote()!.transcript || '') : 'No transcript available.'}</div>
          <h3>Prompt</h3>
          <div>{showNote()!.prompt && formatContent(showNote()!.prompt || '')}</div>
        </>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  )
}