// web/src/components/Instructions.tsx

import React from 'react'

const Instructions: React.FC = () => {
  return (
    <>
    <h1 className="text-4xl font-bold text-emerald-400 mb-8">Generate Show Notes</h1>
    <p>This app uses <a href="https://github.com/ajcwebdev/autoshow" target="_blank">AutoShow</a> and Astro to generate show notes based on video and audio content of any kind.</p>
    <h2 className="text-3xl font-bold mb-6">Instructions</h2>
    <p>
      1. Choose the type of content you want to use 
      (<a href="#examples" className="text-emerald-400 underline">examples</a>)
    </p>
    <p>2. Select the Process Type and paste the link to the type of content you've chosen into Link</p>
    <p>3. Select Transcript Service</p>
    <p>4. Select Whisper Model</p>
    <p>5. Select LLM Model</p>
    <p>6. Select Prompts</p>
    <h3 id="examples" className="text-3xl font-bold mb-6">Examples</h3>
    <div className="overflow-x-auto mb-8">
      <table className="w-full table-fixed border-collapse" style={{ tableLayout: 'fixed' }}>
        <thead>
          <tr className="bg-gray-800">
            <th className="p-4 text-left border-b border-gray-700" style={{ width: '5rem', whiteSpace: 'nowrap' }}>Type</th>
            <th className="p-4 text-left border-b border-gray-700" style={{ width: '20rem' }}>Link</th>
            <th className="p-4 text-left border-b border-gray-700">Description</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-700 hover:bg-gray-800">
            <td className="p-4" style={{ width: '5rem', whiteSpace: 'nowrap' }}>Video</td>
            <td className="p-4 break-words">https://www.youtube.com/watch?v=MORMZXEaONk</td>
            <td className="p-4">Single video content for show notes reference</td>
          </tr>
          <tr className="border-b border-gray-700 hover:bg-gray-800">
            <td className="p-4" style={{ width: '5rem', whiteSpace: 'nowrap' }}>File</td>
            <td className="p-4 break-words">content/audio.mp3</td>
            <td className="p-4">Audio file attachment for the show notes</td>
          </tr>
        </tbody>
      </table>
    </div>
    </>
  )
}

export default Instructions