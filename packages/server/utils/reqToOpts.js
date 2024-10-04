// server/utils/reqToOpts.js

// Function to map request data to processing options
function reqToOpts(requestData) {
  // Define possible options
  const [llmServices, transcriptServices, otherOptions] = [
    // List of supported LLM options
    ['chatgpt', 'claude', 'cohere', 'mistral', 'octo', 'llama', 'ollama', 'gemini'],
    // List of supported transcript services
    ['whisper', 'whisperDocker', 'deepgram', 'assembly'],
    // List of other supported options
    ['speakerLabels', 'prompt', 'noCleanUp', 'order', 'skip', 'info', 'item']
  ]

  // Initialize options object
  const options = {}

  // Check if LLM is provided and valid
  if (requestData.llm && llmServices.includes(requestData.llm)) {
    // Set llmServices
    llmServices = requestData.llm
    // Set LLM model or true
    options[llmServices] = requestData.llmModel || true
  }

  // Determine transcript service and default to 'whisper' if not specified
  transcriptServices = transcriptServices.includes(requestData.transcriptServices)
    ? requestData.transcriptServices
    : 'whisper'

  // Set transcript options
  if (transcriptServices === 'whisper') {
    // Set whisper model
    options.whisperModel = requestData.whisperModel || 'base'
    // Enable whisper option
    options.whisper = options.whisperModel
  } else {
    // Enable selected transcript service
    options[transcriptServices] = true
  }

  // Map other options from request data
  for (const opt of otherOptions) {
    if (requestData[opt] !== undefined) {
      // Set option if provided
      options[opt] = requestData[opt]
    }
  }

  // Return mapped options
  return { options, llmServices, transcriptServices }
}

export { reqToOpts }