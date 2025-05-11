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
  l('[App] Rendering App component with responsive layout')
  return (
    <div class="flex flex-col md:flex-row gap-6 max-w-[1400px] mx-auto px-4 h-auto md:h-screen">
      <div class="flex-1 min-w-0 overflow-y-auto py-6">
        <Form onNewShowNote={handleNewShowNote} />
      </div>
      <div class="w-full md:w-96 flex-shrink-0 border-t md:border-t-0 md:border-l border-border pt-6 md:pt-0">
        <ShowNotes refreshCount={refreshCount()} />
      </div>
    </div>
  )
}