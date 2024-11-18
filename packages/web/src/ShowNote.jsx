// packages/web/src/ShowNote.jsx

import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

const ShowNote = () => {
  const { id } = useParams()
  const [showNote, setShowNote] = useState(null)

  useEffect(() => {
    // Fetch the show note from the backend
    fetch(`http://localhost:3000/show-notes/${id}`)
      .then((response) => response.json())
      .then((data) => {
        setShowNote(data.showNote)
      })
      .catch((error) => {
        console.error('Error fetching show note:', error)
      })
  }, [id])

  if (!showNote) {
    return <div>Loading...</div>
  }

  // Format content by adding line breaks
  const formatContent = (text) => {
    return text.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        <br />
      </React.Fragment>
    ))
  }

  return (
    <div className="show-note">
      <h2>{showNote.title}</h2>
      <p>Date: {showNote.date}</p>
      <div>{formatContent(showNote.content)}</div>
    </div>
  )
}

export default ShowNote