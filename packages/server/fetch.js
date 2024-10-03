// server/fetch.js

const BASE_URL = 'http://localhost:3000'
const VIDEO_ROUTE = 'video'

const data = {
  youtubeUrl: 'https://www.youtube.com/watch?v=jKB0EltG9Jo',
  whisperModel: 'tiny',
  llm: 'llama'
}

const fetchVideo = async () => {
  try {
    const response = await fetch(`${BASE_URL}/${VIDEO_ROUTE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    console.log('Fetch response status:', response.status)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const result = await response.json()
    console.log(result)
  } catch (error) {
    console.error('Error:', error)
  }
}

fetchVideo()