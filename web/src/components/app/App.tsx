// web/src/components/app/App.tsx

import React, { useState, useEffect } from 'react'
import Form from './Form.tsx'
import '../../styles/global.css'

import type { ShowNoteType } from '../../types.ts'

/**
 * The App component displays the Form component and a list of existing show notes.
 * Once show notes are fetched from the backend, each note is listed for navigation
 * to a detailed view.
 *
 * @returns {JSX.Element} A container wrapping input fields and a list of show notes
 */
const App: React.FC = () => {
  const [showNotes, setShowNotes] = useState<ShowNoteType[]>([])

  // Fetch show notes function
  const fetchShowNotes = () => {
    fetch('http://localhost:3000/show-notes')
      .then((response) => response.json())
      .then((data) => {
        setShowNotes(data.showNotes)
      })
      .catch((error) => {
        console.error('Error fetching show notes:', error)
      })
  }

  useEffect(() => {
    fetchShowNotes()
  }, [])

  return (
    <div className="container">
      <Form onNewShowNote={fetchShowNotes} />
      <ul className="show-notes-list">
        <h1>Show Notes</h1>
        {showNotes.map((note) => (
          <li key={note.id}>
            <a href={`/show-notes/${note.id}`}>{note.title}</a> - {note.publishDate}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App