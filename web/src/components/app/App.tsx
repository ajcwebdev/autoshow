// web/src/components/app/App.tsx

import React, { useState } from 'react'
import Form from './Form.tsx'
import '../../styles/global.css'

import { ShowNotes } from './ShowNotes.tsx'

/**
 * The App component renders the Form component and the ShowNotes component.
 * The refreshCount state is used to trigger re-fetching of show notes in the ShowNotes component.
 *
 * @returns {JSX.Element} A container wrapping the Form and ShowNotes components
 */
const App: React.FC = () => {
  const [refreshCount, setRefreshCount] = useState(0)

  /**
   * This function increments the refreshCount state. It is passed to the Form component
   * so that when a new show note is created, the ShowNotes component can be triggered
   * to re-fetch data from the backend.
   */
  const handleNewShowNote = () => {
    setRefreshCount((prevCount) => prevCount + 1)
  }

  return (
    <div className="container">
      <Form onNewShowNote={handleNewShowNote} />
      <ShowNotes refreshCount={refreshCount} />
    </div>
  )
}

export default App