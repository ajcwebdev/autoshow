# Autoshow Server

This is currently a very simple proof-of-concept that only implements the most basic Autoshow command for [processing a single video file from a YouTube URL](/docs/examples.md#process-single-video-or-audio-file):

```bash
npm run autoshow -- --video "https://www.youtube.com/watch?v=MORMZXEaONk"
```

See the [server section of the roadmap](/docs/readmap.md#server) for more information about future development on the server implementation.

## Start Server

Run the following command to start the server:

```bash
npm run serve
```

<details>
  <summary>Note on Node versioning, click to expand.</summary>

Under the hood this runs `node --env-file=.env --watch server/index.js` which eliminates the need for `dotenv` or `nodemon` as dependencies. This means Node v20 or higher is required. I do not plan on supporting previous Node versions as I believe it's generally a bad idea to try and support versions that have passed their end of life dates.

Version 20 enters its maintenance period in October 2024 and end-of-life in April 2026. With that in mind, I plan to transition to Version 22 in 2025 and deprecate Version 20 support in the beginning of 2026. For more information on Node's release schedule, see the [Node.js Release Working Group repository](https://github.com/nodejs/Release).

</details>

## Process Endpoints

### Video Endpoint

Once the server is running, send a `POST` request to `http://localhost:3000/video` containing a JSON object with the YouTube URL:

```bash
curl --json '{
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk"
}' http://localhost:3000/video
```

Use LLM.

```bash
curl --json '{
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "whisperModel": "tiny",
  "llm": "llama"
}' http://localhost:3000/video
```

### Playlist Endpoint

```bash
curl --json '{
  "playlistUrl": "https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr"
}' http://localhost:3000/playlist
```

```bash
curl --json '{
  "playlistUrl": "https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr",
  "whisperModel": "tiny",
  "llm": "llama"
}' http://localhost:3000/playlist
```

### URLs Endpoint

```bash
curl --json '{
  "filePath": "content/example-urls.md"
}' http://localhost:3000/urls
```

```bash
curl --json '{
  "filePath": "content/example-urls.md",
  "whisperModel": "tiny",
  "llm": "llama"
}' http://localhost:3000/urls
```

```bash
curl --json '{
  "filePath": "content/example-urls.md",
  "prompts": ["titles", "mediumChapters"],
  "whisperModel": "tiny",
  "llm": "llama"
}' http://localhost:3000/urls
```

### File Endpoint

```bash
curl --json '{
  "filePath": "content/audio.mp3"
}' http://localhost:3000/file
```

```bash
curl --json '{
  "filePath": "content/audio.mp3",
  "whisperModel": "tiny",
  "llm": "llama"
}' http://localhost:3000/file
```

```bash
curl --json '{
  "filePath": "content/audio.mp3",
  "prompts": ["titles"],
  "whisperModel": "tiny",
  "llm": "llama"
}' http://localhost:3000/file
```

### RSS Endpoint

```bash
curl --json '{
  "rssUrl": "https://feeds.transistor.fm/fsjam-podcast/"
}' http://localhost:3000/rss
```

```bash
curl --json '{
  "rssUrl": "https://feeds.transistor.fm/fsjam-podcast/",
  "whisperModel": "tiny",
  "llm": "llama",
  "order": "newest",
  "skip": 0
}' http://localhost:3000/rss
```

```bash
curl --json '{
  "rssUrl": "https://feeds.transistor.fm/fsjam-podcast/",
  "order": "newest",
  "skip": 94,
  "whisperModel": "tiny"
}' http://localhost:3000/rss
```

```bash
curl --json '{
  "rssUrl": "https://feeds.transistor.fm/fsjam-podcast/",
  "order": "oldest",
  "skip": 94,
  "whisperModel": "tiny"
}' http://localhost:3000/rss
```

## Language Model (LLM) Options

### ChatGPT

```bash
curl --json '{
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "chatgpt"
}' http://localhost:3000/video
```

```bash
curl --json '{
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "chatgpt",
  "llmModel": "GPT_4o_MINI"
}' http://localhost:3000/video
```

### Claude

```bash
curl --json '{
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "claude"
}' http://localhost:3000/video
```

```bash
curl --json '{
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "claude",
  "llmModel": "CLAUDE_3_SONNET"
}' http://localhost:3000/video
```

### Gemini

```bash
curl --json '{
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "gemini"
}' http://localhost:3000/video
```

```bash
curl --json '{
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "gemini",
  "llmModel": "GEMINI_1_5_FLASH"
}' http://localhost:3000/video
```

### Cohere

```bash
curl --json '{
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "cohere"
}' http://localhost:3000/video
```

```bash
curl --json '{
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "cohere",
  "llmModel": "COMMAND_R_PLUS"
}' http://localhost:3000/video
```

### Mistral

```bash
curl --json '{
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "mistral"
}' http://localhost:3000/video
```

```bash
curl --json '{
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "mistral",
  "llmModel": "MIXTRAL_8x7b"
}' http://localhost:3000/video
```

### Octo

```bash
curl --json '{
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "octo"
}' http://localhost:3000/video
```

```bash
curl --json '{
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "octo",
  "llmModel": "LLAMA_3_1_8B"
}' http://localhost:3000/video
```

## Transcription Options

### Whisper.cpp

```bash
curl --json '{
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "whisperModel": "tiny"
}' http://localhost:3000/video
```

### Deepgram

```bash
curl --json '{
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "transcriptService": "deepgram"
}' http://localhost:3000/video
```

```bash
curl --json '{
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "transcriptService": "deepgram",
  "llm": "llama"
}' http://localhost:3000/video
```

### Assembly

```bash
curl --json '{
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "transcriptService": "assembly"
}' http://localhost:3000/video
```

```bash
curl --json '{
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "transcriptService": "assembly",
  "llm": "llama"
}' http://localhost:3000/video
```

```bash
curl --json '{
  "youtubeUrl": "https://ajc.pics/audio/fsjam-short.mp3",
  "transcriptService": "assembly",
  "speakerLabels": true
}' http://localhost:3000/video
```

```bash
curl --json '{
  "youtubeUrl": "https://ajc.pics/audio/fsjam-short.mp3",
  "transcriptService": "assembly",
  "speakerLabels": true,
  "llm": "llama"
}' http://localhost:3000/video
```

## Prompt Options

```bash
curl --json '{
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["titles", "mediumChapters"]
}' http://localhost:3000/video
```

```bash
curl --json '{
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["titles", "summary", "shortChapters", "takeaways", "questions"]
}' http://localhost:3000/video
```

```bash
curl --json '{
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["titles", "summary", "shortChapters", "takeaways", "questions"],
  "whisperModel": "tiny",
  "llm": "llama"
}' http://localhost:3000/video
```

```bash
curl --json '{
  "playlistUrl": "https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr",
  "prompts": ["titles", "mediumChapters"],
  "whisperModel": "tiny",
  "llm": "llama"
}' http://localhost:3000/playlist
```

```bash
curl --json '{
  "playlistUrl": "https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr",
  "prompts": ["titles", "mediumChapters"],
  "whisperModel": "tiny",
  "llm": "llama"
}' http://localhost:3000/playlist
```