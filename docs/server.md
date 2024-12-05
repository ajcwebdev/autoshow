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
  "llm": "ollama"
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
  "llm": "ollama"
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
  "llm": "ollama"
}' http://localhost:3000/urls
```

```bash
curl --json '{
  "filePath": "content/example-urls.md",
  "prompts": ["titles", "mediumChapters"],
  "whisperModel": "tiny",
  "llm": "ollama"
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
  "llm": "ollama"
}' http://localhost:3000/file
```

```bash
curl --json '{
  "filePath": "content/audio.mp3",
  "prompts": ["titles"],
  "whisperModel": "tiny",
  "llm": "ollama"
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
  "llm": "ollama",
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
  "transcriptServices": "deepgram"
}' http://localhost:3000/video
```

```bash
curl --json '{
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "transcriptServices": "deepgram",
  "llm": "ollama"
}' http://localhost:3000/video
```

### Assembly

```bash
curl --json '{
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "transcriptServices": "assembly"
}' http://localhost:3000/video
```

```bash
curl --json '{
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "transcriptServices": "assembly",
  "llm": "ollama"
}' http://localhost:3000/video
```

```bash
curl --json '{
  "youtubeUrl": "https://ajc.pics/audio/fsjam-short.mp3",
  "transcriptServices": "assembly",
  "speakerLabels": true
}' http://localhost:3000/video
```

```bash
curl --json '{
  "youtubeUrl": "https://ajc.pics/audio/fsjam-short.mp3",
  "transcriptServices": "assembly",
  "speakerLabels": true,
  "llm": "ollama"
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
  "llm": "ollama"
}' http://localhost:3000/video
```

```bash
curl --json '{
  "playlistUrl": "https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr",
  "prompts": ["titles", "mediumChapters"],
  "whisperModel": "tiny",
  "llm": "ollama"
}' http://localhost:3000/playlist
```

```bash
curl --json '{
  "playlistUrl": "https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr",
  "prompts": ["titles", "mediumChapters"],
  "whisperModel": "tiny",
  "llm": "ollama"
}' http://localhost:3000/playlist
```

## Test Requests

http://localhost:3000/playlist

```js
const TEST_REQ_01 = {
  "playlistUrl": "https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr"
}

const TEST_REQ_02 = {
  "playlistUrl": "https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr",
  "whisperModel": "tiny"
}

const TEST_REQ_03 = {
  "playlistUrl": "https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr",
  "whisperModel": "tiny",
  "llm": "ollama"
}

const TEST_REQ_04 = {
  "playlistUrl": "https://www.youtube.com/playlist?list=PLCVnrVv4KhXPz0SoAVu8Rc1emAdGPbSbr",
  "prompts": ["titles", "mediumChapters"],
  "whisperModel": "tiny",
  "llm": "ollama"
}
```

### URLs Endpoint

http://localhost:3000/urls

```js
const TEST_REQ_05 = {
  "filePath": "content/example-urls.md"
}

const TEST_REQ_06 = {
  "filePath": "content/example-urls.md",
  "whisperModel": "tiny"
}

const TEST_REQ_07 = {
  "filePath": "content/example-urls.md",
  "whisperModel": "tiny",
  "llm": "ollama"
}

const TEST_REQ_08 = {
  "filePath": "content/example-urls.md",
  "prompts": ["titles", "mediumChapters"],
  "whisperModel": "tiny",
  "llm": "ollama"
}
```

### File Endpoint

http://localhost:3000/file

```js
const TEST_REQ_09 = {
  "filePath": "content/audio.mp3"
}

const TEST_REQ_10 = {
  "filePath": "content/audio.mp3",
  "whisperModel": "tiny"
}

const TEST_REQ_11 = {
  "filePath": "content/audio.mp3",
  "whisperModel": "tiny",
  "llm": "ollama"
}

const TEST_REQ_12 = {
  "filePath": "content/audio.mp3",
  "prompts": ["titles"],
  "whisperModel": "tiny",
  "llm": "ollama"
}
```

### RSS Endpoint

http://localhost:3000/rss

```js
const TEST_REQ_13 = {
  "rssUrl": "https://feeds.transistor.fm/fsjam-podcast/"
}

const TEST_REQ_14 = {
  "rssUrl": "https://feeds.transistor.fm/fsjam-podcast/",
  "whisperModel": "tiny"
}

const TEST_REQ_15 = {
  "rssUrl": "https://feeds.transistor.fm/fsjam-podcast/",
  "whisperModel": "tiny",
  "llm": "ollama"
}

const TEST_REQ_16 = {
  "rssUrl": "https://feeds.transistor.fm/fsjam-podcast/",
  "whisperModel": "tiny",
  "order": "newest",
  "skip": 94
}

const TEST_REQ_17 = {
  "rssUrl": "https://feeds.transistor.fm/fsjam-podcast/",
  "whisperModel": "tiny",
  "order": "oldest",
  "skip": 94
}
```

### Video Endpoint

http://localhost:3000/video

```js
const TEST_REQ_18 = {
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk"
}

const TEST_REQ_19 = {
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "whisperModel": "tiny",
  "llm": "ollama"
}

const TEST_REQ_20 = {
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "chatgpt"
}

const TEST_REQ_21 = {
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "chatgpt",
  "llmModel": "GPT_4o_MINI"
}

const TEST_REQ_22 = {
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "claude"
}

const TEST_REQ_23 = {
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "claude",
  "llmModel": "CLAUDE_3_SONNET"
}

const TEST_REQ_24 = {
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "gemini"
}

const TEST_REQ_25 = {
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "gemini",
  "llmModel": "GEMINI_1_5_FLASH"
}

const TEST_REQ_26 = {
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "cohere"
}

const TEST_REQ_27 = {
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "cohere",
  "llmModel": "COMMAND_R_PLUS"
}

const TEST_REQ_28 = {
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "mistral"
}

const TEST_REQ_29 = {
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "mistral",
  "llmModel": "MIXTRAL_8x7b"
}

const TEST_REQ_32 = {
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "whisperModel": "tiny"
}

const TEST_REQ_33 = {
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "transcriptServices": "deepgram"
}

const TEST_REQ_34 = {
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "transcriptServices": "deepgram",
  "llm": "ollama"
}

const TEST_REQ_35 = {
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "transcriptServices": "assembly"
}

const TEST_REQ_36 = {
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "transcriptServices": "assembly",
  "llm": "ollama"
}

const TEST_REQ_37 = {
  "youtubeUrl": "https://ajc.pics/audio/fsjam-short.mp3",
  "transcriptServices": "assembly",
  "speakerLabels": true
}

const TEST_REQ_38 = {
  "youtubeUrl": "https://ajc.pics/audio/fsjam-short.mp3",
  "transcriptServices": "assembly",
  "speakerLabels": true,
  "llm": "ollama"
}

const TEST_REQ_39 = {
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["titles", "mediumChapters"]
}

const TEST_REQ_40 = {
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["titles", "summary", "shortChapters", "takeaways", "questions"]
}

const TEST_REQ_41 = {
  "youtubeUrl": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["titles", "summary", "shortChapters", "takeaways", "questions"],
  "whisperModel": "tiny",
  "llm": "ollama"
}
```