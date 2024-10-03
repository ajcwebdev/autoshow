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

  // Initialize options object
  const options = {}
  // Initialize llm option
  let llmOpt = null
  // Initialize transcript option
  let transcriptOpt = null

  // Check if LLM is provided and valid
  if (requestData.llm && llmOptions.includes(requestData.llm)) {
    // Set llmOpt
    llmOpt = requestData.llm
    // Set LLM model or true
    options[llmOpt] = requestData.llmModel || true
  }

  // Determine transcript service and default to 'whisper' if not specified
  transcriptOpt = transcriptOptions.includes(requestData.transcriptService)
    ? requestData.transcriptService
    : 'whisper'

  // Set transcript options
  if (transcriptOpt === 'whisper') {
    // Set whisper model
    options.whisperModel = requestData.whisperModel || 'base'
    // Enable whisper option
    options.whisper = options.whisperModel
  } else {
    // Enable selected transcript service
    options[transcriptOpt] = true
  }

  // Map other options from request data
  for (const opt of otherOptions) {
    if (requestData[opt] !== undefined) {
      // Set option if provided
      options[opt] = requestData[opt]
    }
  }

  // Return mapped options
  return { options, llmOpt, transcriptOpt }
}

export { reqToOpts }