// web/src/components/ShowNote.tsx

import React, { useState, useEffect } from 'react'

import type { ShowNoteType } from "@/types"

/**
 * A React component that fetches and displays a single show note from a backend API.
 * It derives the show note's ID from the current URL path and retrieves detailed
 * information such as title, publish date, transcript, front matter, prompt, and LLM output.
 *
 * @returns {JSX.Element} A fully rendered component containing show note data
 */
export const ShowNote: React.FC = () => {
  const [showNote, setShowNote] = useState<ShowNoteType | null>(null)

  useEffect(() => {
    // Get ID from URL path
    const id = window.location.pathname.split('/').pop()

    // Fetch the show note from the backend
    fetch(`http://localhost:3000/show-notes/${id}`)
      .then((response) => response.json())
      .then((data) => {
        setShowNote(data.showNote)
      })
      .catch((error) => {
        console.error('Error fetching show note:', error)
      })
  }, [])

  if (!showNote) {
    return <div>Loading...</div>
  }

  // Format content by adding line breaks
  const formatContent = (text: string) => {
    return text.split('\n').map((line: string, index: number) => (
      <React.Fragment key={index}>
        {line}
        <br />
      </React.Fragment>
    ))
  }

  return (
    <div className="show-note">
      <h2>{showNote.title}</h2>
      <p>Date: {showNote.publishdate}</p>

      <h3>LLM Output</h3>
      <div>{showNote.llmOutput && formatContent(showNote.llmOutput)}</div>

      <h3>Front Matter</h3>
      <div>{showNote.frontmatter && formatContent(showNote.frontmatter)}</div>

      <h3>Transcript</h3>
      <div>{showNote.transcript ? formatContent(showNote.transcript) : 'No transcript available.'}</div>

      <h3>Prompt</h3>
      <div>{showNote.prompt && formatContent(showNote.prompt)}</div>
    </div>
  )
}