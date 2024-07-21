// server/video.js

import { processVideo } from '../commands/processVideo.js'
import { getModel } from '../utils/index.js'

const handleVideoRequest = async (req, res) => {
  let body = ''

  req.on('data', chunk => {
    body += chunk.toString()
  })

  req.on('end', async () => {
    try {
      const { youtubeUrl, model: requestedModel = 'base', llm } = JSON.parse(body)

      if (!youtubeUrl) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'YouTube URL is required' }))
        return
      }

      const model = getModel(requestedModel)
      
      // Initialize LLM flags
      const llmFlags = {
        chatgpt: false,
        claude: false,
        cohere: false,
        mistral: false,
        octo: false
      }

      // Set the selected LLM flag to true
      if (llm && llm in llmFlags) {
        llmFlags[llm] = true
      } else if (llm) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Invalid LLM option' }))
        return
      }

      const commonArgs = [
        model,
        llmFlags.chatgpt,
        llmFlags.claude,
        llmFlags.cohere,
        llmFlags.mistral,
        llmFlags.octo,
        false, // deepgram
        false  // assembly
      ]

      const finalContent = await processVideo(youtubeUrl, ...commonArgs)

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ 
        message: 'Video processed successfully.',
        content: finalContent
      }))
    } catch (error) {
      console.error('Error processing video:', error)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'An error occurred while processing the video' }))
    }
  })
}

export { handleVideoRequest }