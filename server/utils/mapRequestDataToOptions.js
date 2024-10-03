// server/utils/mapRequestDataToOptions.js

function mapRequestDataToOptions(requestData) {
  const [llmOptions, transcriptOptions, otherOptions] = [
    ['chatgpt', 'claude', 'cohere', 'mistral', 'octo', 'llama', 'ollama', 'gemini'],
    ['whisper', 'whisperDocker', 'deepgram', 'assembly'],
    ['speakerLabels', 'prompt', 'noCleanUp', 'order', 'skip', 'info', 'item']
  ]

  const options = {}
  let llmOpt = null
  let transcriptOpt = null

  if (requestData.llm && llmOptions.includes(requestData.llm)) {
    llmOpt = requestData.llm
    options[llmOpt] = requestData.llmModel || true
  }

  transcriptOpt = transcriptOptions.includes(requestData.transcriptService)
    ? requestData.transcriptService
    : 'whisper'
  
  if (transcriptOpt === 'whisper') {
    options.whisperModel = requestData.whisperModel || 'base'
    options.whisper = options.whisperModel
  } else {
    options[transcriptOpt] = true
  }

  for (const opt of otherOptions) {
    if (requestData[opt] !== undefined) {
      options[opt] = requestData[opt]
    }
  }

  return { options, llmOpt, transcriptOpt }
}

export { mapRequestDataToOptions }