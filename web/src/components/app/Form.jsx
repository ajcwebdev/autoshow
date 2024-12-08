// packages/web/src/Form.jsx

import React, { useState, useEffect } from 'react'
import {
  PROMPT_CHOICES, TRANSCRIPTION_SERVICES, WHISPER_MODELS, LLM_SERVICES, LLM_MODELS
} from '@/site-config'
// import { BrowserRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom'

// Alert component to display error messages
const Alert = ({ message, variant }) => (
  <div className={`alert ${variant}`}>
    <p>{message}</p>
  </div>
)

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

const Inputs = ({ onNewShowNote }) => {
  // State variables
  const [youtubeUrl, setYoutubeUrl] = useState('https://www.youtube.com/watch?v=MORMZXEaONk')
  const [transcriptionService, setTranscriptionService] = useState('whisper')
  const [whisperModel, setWhisperModel] = useState('base')
  const [llmService, setLlmService] = useState('none')
  const [llmModel, setLlmModel] = useState('')
  const [selectedPrompts, setSelectedPrompts] = useState(['summary'])
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setResult(null)

    if (selectedPrompts.length === 0) {
      setError('Please select at least one prompt.')
      setIsLoading(false)
      return
    }

    try {
      // Prepare the request body
      const requestBody = {
        youtubeUrl,
        transcriptServices: transcriptionService,
        llm: llmService,
        prompt: selectedPrompts,
      }

      if (transcriptionService.startsWith('whisper')) {
        requestBody.whisperModel = whisperModel
      }

      if (llmService) {
        requestBody.llmModel = llmModel
      }

      // Send POST request to the backend
      const response = await fetch('http://localhost:3000/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setResult(data) // Set result to the data object containing content

      // Fetch the updated list of show notes
      onNewShowNote()
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
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
    <>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="youtubeUrl">YouTube URL</label>
          <input
            // placeholder="https://www.youtube.com/watch?v=MORMZXEaONk"
            type="text"
            id="youtubeUrl"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="transcriptionService">Transcription Service</label>
          <select
            id="transcriptionService"
            value={transcriptionService}
            onChange={(e) => setTranscriptionService(e.target.value)}
          >
            {TRANSCRIPTION_SERVICES.map((service) => (
              <option key={service.value} value={service.value}>
                {service.label}
              </option>
            ))}
          </select>
        </div>

        {transcriptionService.startsWith('whisper') && (
          <div className="form-group">
            <label htmlFor="whisperModel">Whisper Model</label>
            <select
              id="whisperModel"
              value={whisperModel}
              onChange={(e) => setWhisperModel(e.target.value)}
            >
              {WHISPER_MODELS.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="llmService">LLM Service</label>
          <select
            id="llmService"
            value={llmService}
            onChange={(e) => {
              setLlmService(e.target.value)
              // Reset the LLM model when the service changes
              setLlmModel('')
            }}
          >
            <option value="">None</option>
            {LLM_SERVICES.map((service) => (
              <option key={service.value} value={service.value}>
                {service.label}
              </option>
            ))}
          </select>
        </div>

        {llmService && LLM_MODELS[llmService] && (
          <div className="form-group">
            <label htmlFor="llmModel">LLM Model</label>
            <select
              id="llmModel"
              value={llmModel}
              onChange={(e) => setLlmModel(e.target.value)}
            >
              {LLM_MODELS[llmService].map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="form-group">
          <label>Prompts</label>
          <div className="checkbox-group">
            {PROMPT_CHOICES.map((prompt) => (
              <div key={prompt.value}>
                <input
                  type="checkbox"
                  id={`prompt-${prompt.value}`}
                  value={prompt.value}
                  checked={selectedPrompts.includes(prompt.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPrompts([...selectedPrompts, prompt.value])
                    } else {
                      setSelectedPrompts(
                        selectedPrompts.filter((p) => p !== prompt.value)
                      )
                    }
                  }}
                />
                <label htmlFor={`prompt-${prompt.value}`}>{prompt.label}</label>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Submit'}
        </button>
      </form>
      {error && <Alert message={error} variant="error" />}
      {result && (
        <div className="result">
          <h2>Result:</h2>
          <div>{formatContent(result.content)}</div>
        </div>
      )}
    </>
  )
}

const Form = () => {
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
    <div className="container">
      <Inputs client:only="react" onNewShowNote={fetchShowNotes} />
    </div>
  )

  // return (
  //   <Router>
  //     <div className="container">
  //       <h1>Show Notes</h1>
  //       <Routes>
  //         <Route
  //           path="/"
  //           element={
  //             <>
  //               <ul className="show-notes-list">
  //                 {showNotes.map((note) => (
  //                   <li key={note.id}>
  //                     <Link to={`/show-notes/${note.id}`}>{note.title}</Link> - {note.date}
  //                   </li>
  //                 ))}
  //               </ul>
  //               <Input onNewShowNote={fetchShowNotes} />
  //             </>
  //           }
  //         />
  //         <Route path="/show-notes/:id" element={<ShowNote />} />
  //       </Routes>
  //     </div>
  //   </Router>
  // )
}

export default Form