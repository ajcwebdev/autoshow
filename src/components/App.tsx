// src/components/App.tsx

import { createSignal } from 'solid-js'
import Form from './Form'
import { ShowNotes } from './ShowNotes'
import '../styles/global.css'
const l = console.log
export default function App() {
  const [refreshCount, setRefreshCount] = createSignal(0)
  l('[App] Initialized with refreshCount signal')
  const handleNewShowNote = () => {
    l('[App] New show note created, refreshing ShowNotes component')
    setRefreshCount(prev => prev + 1)
  }
  l('[App] Rendering App component')
  return (
    <div class="max-w-[1100px] mx-auto px-4">
      <Form onNewShowNote={handleNewShowNote} />
      <ShowNotes refreshCount={refreshCount()} />
    </div>
  )
}