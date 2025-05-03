// src/components/Instructions.tsx

import type { Component } from 'solid-js'

const Instructions: Component = () => {
  return (
    <>
    <h1 class="text-4xl font-bold text-emerald-400 mb-8">Generate Show Notes</h1>
    <p>This app uses <a href="https://github.com/ajcwebdev/autoshow" target="_blank">AutoShow</a> and Astro to generate show notes based on video and audio content of any kind.</p>
    <h2 class="text-3xl font-bold mb-6">Instructions</h2>
    <p>
      1. Choose the type of content you want to use 
      (<a href="#examples" class="text-emerald-400 underline">examples</a>)
    </p>
    <p>2. Select the Process Type and paste the link to the type of content you've chosen into Link</p>
    <p>3. Select Transcription Service</p>
    <p>4. Select Transcription Model</p>
    <p>5. Select LLM Model</p>
    <p>6. Select Prompts</p>
    <h3 id="examples" class="text-3xl font-bold mb-6">Examples</h3>
    <div class="overflow-x-auto mb-8">
      <table class="w-full table-fixed border-collapse" style={{ 'table-layout': 'fixed' }}>
        <thead>
          <tr class="bg-gray-800">
            <th class="p-4 text-left border-b border-gray-700" style={{ width: '5rem', 'white-space': 'nowrap' }}>Type</th>
            <th class="p-4 text-left border-b border-gray-700" style={{ width: '20rem' }}>Link</th>
            <th class="p-4 text-left border-b border-gray-700">Description</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-gray-700 hover:bg-gray-800">
            <td class="p-4" style={{ width: '5rem', 'white-space': 'nowrap' }}>Video</td>
            <td class="p-4 break-words">https://www.youtube.com/watch?v=MORMZXEaONk</td>
            <td class="p-4">Single video content for show notes reference</td>
          </tr>
          <tr class="border-b border-gray-700 hover:bg-gray-800">
            <td class="p-4" style={{ width: '5rem', 'white-space': 'nowrap' }}>File</td>
            <td class="p-4 break-words">autoshow/content/examples/audio.mp3</td>
            <td class="p-4">Audio file attachment for the show notes</td>
          </tr>
        </tbody>
      </table>
    </div>
    </>
  )
}

export default Instructions