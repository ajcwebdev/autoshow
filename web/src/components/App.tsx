// web/src/components/App.tsx

import React, { useState } from 'react'
import Form from '@/components/Form'
import { ShowNotes } from '@/components/ShowNotes'
// import Instructions from '@/components/Instructions'
import '@/styles'

const App: React.FC = () => {
  const [refreshCount, setRefreshCount] = useState(0)

  const handleNewShowNote = () => {
    setRefreshCount((prevCount) => prevCount + 1)
  }

  return (
    <div className="container">
      {/* <Instructions /> */}
      <Form onNewShowNote={handleNewShowNote} />
      <ShowNotes refreshCount={refreshCount} />
    </div>
  )
}

export default App