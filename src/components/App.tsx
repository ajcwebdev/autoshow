// src/components/App.tsx

import { createSignal } from 'solid-js'
import Form from './Form'
import { ShowNotes } from './ShowNotes'
// import Instructions from './Instructions'
import '../styles/global.css'

export default function App() {
  const [refreshCount, setRefreshCount] = createSignal(0)
  
  const handleNewShowNote = () => {
    setRefreshCount(prev => prev + 1)
  }
  
  return (
    <div class="container">
      {/* <Instructions /> */}
      <Form onNewShowNote={handleNewShowNote} />
      <ShowNotes refreshCount={refreshCount()} />
    </div>
  )
}