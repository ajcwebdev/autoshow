// web/src/components/app/Form.tsx

import React, { useState, useEffect } from 'react'
import {
  PROMPT_CHOICES,
  TRANSCRIPTION_SERVICES,
  WHISPER_MODELS,
  LLM_SERVICES,
  LLM_MODELS
} from '@/site-config'
import '../../styles/global.css'

// Define types for the Alert component props
interface AlertProps {
  message: string
  variant: string
}

// Alert component to display error messages
const Alert: React.FC<AlertProps> = ({ message, variant }) => (
  <div className={`alert ${variant}`}>
    <p>{message}</p>
  </div>
)

// Define types for show notes
interface ShowNoteType {
  title: string
  date: string
  content: string
  id?: number
}

// Export ShowNote component to be used in [id].astro
export const ShowNote: React.FC = () => {
  const [showNote, setShowNote] = useState<ShowNoteType | null>(null)

  useEffect(() => {
    // Get ID from URL path
    const id = window.location.pathname.split('/').pop()

    // Fetch the show note from the backend
    fetch(`http://localhost:3000/show-notes/${id}`)
      .then((response) => response.json())
      .then((data) => {
        setShowNote(data.showNote)
      })
      .catch((error) => {
        console.error('Error fetching show note:', error)
      })
  }, [])

  if (!showNote) {
    return <div>Loading...</div>
  }

  // Format content by adding line breaks
  const formatContent = (text: string) => {
    return text.split('\n').map((line: string, index: number) => (
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

// Define the allowed LLM service keys from LLM_MODELS
type LlmServiceKey = keyof typeof LLM_MODELS

// Define props for the Inputs component
interface InputsProps {
  onNewShowNote: () => void
}

// Define type for the result object returned by the server
interface ResultType {
  content: string
}

// Inputs component for the form
const Inputs: React.FC<InputsProps> = ({ onNewShowNote }) => {
  const [youtubeUrl, setYoutubeUrl] = useState<string>('https://www.youtube.com/watch?v=MORMZXEaONk')
  const [transcriptionService, setTranscriptionService] = useState<string>('whisper')
  const [whisperModel, setWhisperModel] = useState<string>('base')
  const [llmService, setLlmService] = useState<string>('')
  const [llmModel, setLlmModel] = useState<string>('')
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>(['summary'])
  const [result, setResult] = useState<ResultType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
      const requestBody: {
        youtubeUrl: string
        transcriptServices: string
        llm: string
        prompt: string[]
        whisperModel?: string
        llmModel?: string
      } = {
        youtubeUrl,
        transcriptServices: transcriptionService,
        llm: llmService,
        prompt: selectedPrompts
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

      const data = await response.json() as ResultType
      setResult(data) // Set result to the data object containing content

      // Fetch the updated list of show notes
      onNewShowNote()
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unknown error occurred.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Format content by adding line breaks
  const formatContent = (text: string) => {
    return text.split('\n').map((line: string, index: number) => (
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

        {/* Only show LLM Models if llmService is a valid key of LLM_MODELS */}
        {llmService && (llmService in LLM_MODELS) && (
          <div className="form-group">
            <label htmlFor="llmModel">LLM Model</label>
            <select
              id="llmModel"
              value={llmModel}
              onChange={(e) => setLlmModel(e.target.value)}
            >
              {LLM_MODELS[llmService as LlmServiceKey].map((model) => (
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

const Form: React.FC = () => {
  const [showNotes, setShowNotes] = useState<ShowNoteType[]>([])

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
      <ul className="show-notes-list">
        {showNotes.map((note) => (
          <li key={note.id}>
            <a href={`/show-notes/${note.id}`}>
              {note.title}
            </a> - {note.date}
          </li>
        ))}
      </ul>
      <Inputs onNewShowNote={fetchShowNotes} />
    </div>
  )
}

export default Form