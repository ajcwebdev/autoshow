// packages/web/src/Form.jsx

import React, { useState } from 'react'

// Define constants for prompts, transcription services, Whisper models, LLM services, and their models
const PROMPT_CHOICES = [
  { value: 'titles', label: 'Titles' },
  { value: 'summary', label: 'Summary' },
  { value: 'shortChapters', label: 'Short Chapters' },
  { value: 'mediumChapters', label: 'Medium Chapters' },
  { value: 'longChapters', label: 'Long Chapters' },
  { value: 'takeaways', label: 'Key Takeaways' },
  { value: 'questions', label: 'Questions' },
]

const TRANSCRIPTION_SERVICES = [
  { value: 'whisper', label: 'Whisper.cpp' },
  { value: 'whisperDocker', label: 'Whisper.cpp (Docker)' },
  { value: 'whisperPython', label: 'Whisper Python' },
  { value: 'whisperDiarization', label: 'Whisper Diarization' },
  { value: 'deepgram', label: 'Deepgram' },
  { value: 'assembly', label: 'AssemblyAI' },
]

const WHISPER_MODELS = [
  { value: 'tiny', label: 'tiny' },
  { value: 'tiny.en', label: 'tiny.en' },
  { value: 'base', label: 'base' },
  { value: 'base.en', label: 'base.en' },
  { value: 'small', label: 'small' },
  { value: 'small.en', label: 'small.en' },
  { value: 'medium', label: 'medium' },
  { value: 'medium.en', label: 'medium.en' },
  { value: 'large-v1', label: 'large-v1' },
  { value: 'large-v2', label: 'large-v2' },
  { value: 'large-v3-turbo', label: 'large-v3-turbo' },
  { value: 'turbo', label: 'turbo' },
]

const LLM_SERVICES = [
  { value: 'chatgpt', label: 'ChatGPT' },
  { value: 'claude', label: 'Claude' },
  { value: 'cohere', label: 'Cohere' },
  { value: 'mistral', label: 'Mistral' },
  { value: 'ollama', label: 'Ollama' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'fireworks', label: 'Fireworks' },
  { value: 'together', label: 'Together AI' },
  { value: 'groq', label: 'Groq' },
]

const LLM_MODELS = {
  chatgpt: [
    { value: 'gpt-4o-mini', label: 'GPT 4o Mini' },
    { value: 'gpt-4o', label: 'GPT 4o' },
    { value: 'gpt-4-turbo', label: 'GPT 4 Turbo' },
    { value: 'gpt-4', label: 'GPT 4' },
  ],
  claude: [
    { value: 'claude-3-5-sonnet-20240620', label: 'Claude 3.5 Sonnet' },
    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
    { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
  ],
  cohere: [
    { value: 'command-r', label: 'Command R' },
    { value: 'command-r-plus', label: 'Command R Plus' },
  ],
  mistral: [
    { value: 'open-mixtral-8x7b', label: 'Mixtral 8x7b' },
    { value: 'open-mixtral-8x22b', label: 'Mixtral 8x22b' },
    { value: 'mistral-large-latest', label: 'Mistral Large' },
    { value: 'open-mistral-nemo', label: 'Mistral Nemo' },
  ],
  ollama: [
    { value: 'llama3.2:1b', label: 'LLAMA 3.2 1B' },
    { value: 'llama3.2:3b', label: 'LLAMA 3.2 3B' },
    { value: 'gemma2:2b', label: 'GEMMA 2 2B' },
    { value: 'phi3.5:3.8b', label: 'PHI 3.5' },
    { value: 'qwen2.5:1.5b', label: 'QWEN 2.5 1.5B' },
    { value: 'qwen2.5:3b', label: 'QWEN 2.5 3B' },
  ],
  gemini: [
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    { value: 'gemini-1.5-pro-exp-0827', label: 'Gemini 1.5 Pro' },
  ],
  fireworks: [
    { value: 'accounts/fireworks/models/llama-v3p1-405b-instruct', label: 'LLAMA 3.1 405B' },
    { value: 'accounts/fireworks/models/llama-v3p1-70b-instruct', label: 'LLAMA 3.1 70B' },
    { value: 'accounts/fireworks/models/llama-v3p1-8b-instruct', label: 'LLAMA 3.1 8B' },
    { value: 'accounts/fireworks/models/llama-v3p2-3b-instruct', label: 'LLAMA 3.2 3B' },
    { value: 'accounts/fireworks/models/llama-v3p2-1b-instruct', label: 'LLAMA 3.2 1B' },
    { value: 'accounts/fireworks/models/qwen2p5-72b-instruct', label: 'QWEN 2.5 72B' },
  ],
  together: [
    { value: 'meta-llama/Llama-3.2-3B-Instruct-Turbo', label: 'LLAMA 3.2 3B' },
    { value: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo', label: 'LLAMA 3.1 405B' },
    { value: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', label: 'LLAMA 3.1 70B' },
    { value: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo', label: 'LLAMA 3.1 8B' },
    { value: 'google/gemma-2-27b-it', label: 'Gemma 2 27B' },
    { value: 'google/gemma-2-9b-it', label: 'Gemma 2 9B' },
    { value: 'Qwen/Qwen2.5-72B-Instruct-Turbo', label: 'QWEN 2.5 72B' },
    { value: 'Qwen/Qwen2.5-7B-Instruct-Turbo', label: 'QWEN 2.5 7B' },
  ],
  groq: [
    { value: 'llama-3.1-70b-versatile', label: 'LLAMA 3.1 70B Versatile' },
    { value: 'llama-3.1-8b-instant', label: 'LLAMA 3.1 8B Instant' },
    { value: 'llama-3.2-1b-preview', label: 'LLAMA 3.2 1B Preview' },
    { value: 'llama-3.2-3b-preview', label: 'LLAMA 3.2 3B Preview' },
    { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7b 32768' },
  ],
}

// Alert component to display error messages
const Alert = ({ message, variant }) => (
  <div className={`alert ${variant}`}>
    <p>{message}</p>
  </div>
)

const Form = ({ onNewShowNote }) => {
  // State variables
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [transcriptionService, setTranscriptionService] = useState('whisper')
  const [whisperModel, setWhisperModel] = useState('large-v3-turbo')
  const [llmService, setLlmService] = useState('chatgpt')
  const [llmModel, setLlmModel] = useState('gpt-4o')
  const [selectedPrompts, setSelectedPrompts] = useState([])
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

export default Form