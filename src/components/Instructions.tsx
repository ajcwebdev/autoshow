// src/components/Instructions.tsx

import type { Component } from 'solid-js'
const l = console.log
const Instructions: Component = () => {
  l('[Instructions] Rendering instructions component')
  return (
    <div class="markdown-content space-y-4 mb-8">
      <h1 class="h1 text-primary-400 mb-8">Generate Show Notes</h1>
      <p class="description">This app uses <a href="https://github.com/ajcwebdev/autoshow" target="_blank" class="text-primary-500 hover:text-primary-400 underline">AutoShow</a> and Astro to generate show notes based on video and audio content of any kind.</p>
      <h2 class="h2 mb-6">Instructions</h2>
      <p class="description">
        1. Choose the type of content you want to use
        (<a href="#examples" class="text-primary-500 hover:text-primary-400 underline">examples</a>)
      </p>
      <p class="description">2. Select the Process Type and paste the link to the type of content you've chosen into Link</p>
      <p class="description">3. Select Transcription Service</p>
      <p class="description">4. Select Transcription Model</p>
      <p class="description">5. Select LLM Model</p>
      <p class="description">6. Select Prompts</p>
      <h3 id="examples" class="h3 mb-6">Examples</h3>
      <div class="overflow-x-auto mb-8">
        <table class="w-full table-fixed border-collapse">
          <thead>
            <tr class="bg-base-800">
              <th class="p-4 text-left border-b border-border" style={{ width: '5rem', 'white-space': 'nowrap' }}>Type</th>
              <th class="p-4 text-left border-b border-border" style={{ width: '20rem' }}>Link</th>
              <th class="p-4 text-left border-b border-border">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-border hover:bg-base-800">
              <td class="p-4" style={{ width: '5rem', 'white-space': 'nowrap' }}>Video</td>
              <td class="p-4 break-words">https://www.youtube.com/watch?v=MORMZXEaONk</td>
              <td class="p-4">Single video content for show notes reference</td>
            </tr>
            <tr class="border-b border-border hover:bg-base-800">
              <td class="p-4" style={{ width: '5rem', 'white-space': 'nowrap' }}>File</td>
              <td class="p-4 break-words">autoshow/content/examples/audio.mp3</td>
              <td class="p-4">Audio file attachment for the show notes</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
export default Instructions