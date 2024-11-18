// packages/web/src/App.jsx

import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Form from './Form.jsx'
import ShowNote from './ShowNote.jsx'

const App = () => {
  const [showNotes, setShowNotes] = useState([])

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
    <Router>
      <div className="container">
        <h1>Show Notes</h1>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <ul className="show-notes-list">
                  {showNotes.map((note) => (
                    <li key={note.id}>
                      <Link to={`/show-notes/${note.id}`}>{note.title}</Link> - {note.date}
                    </li>
                  ))}
                </ul>
                <Form onNewShowNote={fetchShowNotes} />
              </>
            }
          />
          <Route path="/show-notes/:id" element={<ShowNote />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App