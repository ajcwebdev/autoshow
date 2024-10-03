// server/utils/reqToOpts.js

// Function to map request data to processing options
function reqToOpts(requestData) {
  // Define possible options
  const [llmOptions, transcriptOptions, otherOptions] = [
    // List of supported LLM options
    ['chatgpt', 'claude', 'cohere', 'mistral', 'octo', 'llama', 'ollama', 'gemini'],
    // List of supported transcript services
    ['whisper', 'whisperDocker', 'deepgram', 'assembly'],
    // List of other supported options
    ['speakerLabels', 'prompt', 'noCleanUp', 'order', 'skip', 'info', 'item']
  ]

  const options = {} // Initialize options object
  let llmOpt = null // Initialize llm option
  let transcriptOpt = null // Initialize transcript option

  // Check if LLM is provided and valid
  if (requestData.llm && llmOptions.includes(requestData.llm)) {
    llmOpt = requestData.llm // Set llmOpt
    options[llmOpt] = requestData.llmModel || true // Set LLM model or true
  }

  // Determine transcript service
  transcriptOpt = transcriptOptions.includes(requestData.transcriptService)
    ? requestData.transcriptService
    : 'whisper' // Default to 'whisper' if not specified

  // Set transcript options
  if (transcriptOpt === 'whisper') {
    options.whisperModel = requestData.whisperModel || 'base' // Set whisper model
    options.whisper = options.whisperModel // Enable whisper option
  } else {
    options[transcriptOpt] = true // Enable selected transcript service
  }

  // Map other options from request data
  for (const opt of otherOptions) {
    if (requestData[opt] !== undefined) {
      options[opt] = requestData[opt] // Set option if provided
    }
  }

  return { options, llmOpt, transcriptOpt } // Return mapped options
}

export { reqToOpts } // Export the function