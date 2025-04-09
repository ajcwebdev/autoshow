// web/src/components/ShowNotes.tsx

import React, { useState, useEffect } from 'react'

import type { ShowNoteType } from "../../../shared/types.ts"

export const ShowNotes: React.FC<{ refreshCount: number }> = ({ refreshCount }) => {
  const [showNotes, setShowNotes] = useState<ShowNoteType[]>([])

  /**
   * Fetches the list of show notes from the backend API and updates component state.
   */
  const fetchShowNotes = async () => {
    try {
      const response = await fetch('http://localhost:3000/show-notes')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setShowNotes(data.showNotes)
    } catch (error) {
      console.error('Error fetching show notes:', error)
    }
  }

  /**
   * Triggers fetchShowNotes on initial render and whenever refreshCount changes.
   */
  useEffect(() => {
    fetchShowNotes()
  }, [refreshCount])

  return (
    <ul className="show-notes-list">
      <h1>Show Notes</h1>
      {showNotes.map((note) => (
        <li key={note.id}>
          <a href={`/show-notes/${note.id}`}>{note.title}</a> - {note.publishDate}
        </li>
      ))}
    </ul>
  )
}