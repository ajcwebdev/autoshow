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

## Process Endpoint

Once the server is running, send a `POST` request to `http://localhost:3000/process` containing a JSON object:

### Video Type

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk"
}' http://localhost:3000/process
```

Use LLM.

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "whisperModel": "tiny",
  "llm": "ollama"
}' http://localhost:3000/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "whisperModel": "tiny",
  "llm": "ollama",
  "llmModel": "DEEPSEEK_R1_1_5B"
}' http://localhost:3000/process
```

### File Type

```bash
curl --json '{
  "type": "file",
  "filePath": "content/audio.mp3"
}' http://localhost:3000/process
```

```bash
curl --json '{
  "type": "file",
  "filePath": "content/audio.mp3",
  "whisperModel": "tiny",
  "llm": "ollama"
}' http://localhost:3000/process
```

```bash
curl --json '{
  "type": "file",
  "filePath": "content/audio.mp3",
  "prompts": ["titles"],
  "whisperModel": "tiny",
  "llm": "ollama"
}' http://localhost:3000/process
```

## Language Model (LLM) Options

### ChatGPT

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "chatgpt"
}' http://localhost:3000/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "chatgpt",
  "llmModel": "GPT_4o_MINI"
}' http://localhost:3000/process
```

### Claude

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "claude"
}' http://localhost:3000/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "claude",
  "llmModel": "CLAUDE_3_SONNET"
}' http://localhost:3000/process
```

### Gemini

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "gemini"
}' http://localhost:3000/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "gemini",
  "llmModel": "GEMINI_1_5_FLASH"
}' http://localhost:3000/process
```

### Cohere

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "cohere"
}' http://localhost:3000/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "cohere",
  "llmModel": "COMMAND_R_PLUS"
}' http://localhost:3000/process
```

### Mistral

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "mistral"
}' http://localhost:3000/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "mistral",
  "llmModel": "MIXTRAL_8x7b"
}' http://localhost:3000/process
```

## Transcription Options

### Whisper.cpp

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "whisperModel": "tiny"
}' http://localhost:3000/process
```

### Deepgram

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "transcriptServices": "deepgram"
}' http://localhost:3000/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "transcriptServices": "deepgram",
  "llm": "ollama"
}' http://localhost:3000/process
```

### Assembly

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "transcriptServices": "assembly"
}' http://localhost:3000/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "transcriptServices": "assembly",
  "llm": "ollama"
}' http://localhost:3000/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://ajc.pics/audio/fsjam-short.mp3",
  "transcriptServices": "assembly",
  "speakerLabels": true
}' http://localhost:3000/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://ajc.pics/audio/fsjam-short.mp3",
  "transcriptServices": "assembly",
  "speakerLabels": true,
  "llm": "ollama"
}' http://localhost:3000/process
```

## Prompt Options

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["titles", "mediumChapters"]
}' http://localhost:3000/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["titles", "summary", "shortChapters", "takeaways", "questions"]
}' http://localhost:3000/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["titles", "summary", "shortChapters", "takeaways", "questions"],
  "whisperModel": "tiny",
  "llm": "ollama"
}' http://localhost:3000/process
```

## Test Requests

```js
const TEST_REQ_09 = {
  "type": "file",
  "filePath": "content/audio.mp3"
}

const TEST_REQ_10 = {
  "type": "file",
  "filePath": "content/audio.mp3",
  "whisperModel": "tiny"
}

const TEST_REQ_11 = {
  "type": "file",
  "filePath": "content/audio.mp3",
  "whisperModel": "tiny",
  "llm": "ollama"
}

const TEST_REQ_12 = {
  "type": "file",
  "filePath": "content/audio.mp3",
  "prompts": ["titles"],
  "whisperModel": "tiny",
  "llm": "ollama"
}

const TEST_REQ_18 = {
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk"
}

const TEST_REQ_19 = {
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "whisperModel": "tiny",
  "llm": "ollama"
}

const TEST_REQ_20 = {
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "chatgpt"
}

const TEST_REQ_21 = {
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "chatgpt",
  "llmModel": "GPT_4o_MINI"
}

const TEST_REQ_22 = {
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "claude"
}

const TEST_REQ_23 = {
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "claude",
  "llmModel": "CLAUDE_3_SONNET"
}

const TEST_REQ_24 = {
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "gemini"
}

const TEST_REQ_25 = {
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "gemini",
  "llmModel": "GEMINI_1_5_FLASH"
}

const TEST_REQ_26 = {
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "cohere"
}

const TEST_REQ_27 = {
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "cohere",
  "llmModel": "COMMAND_R_PLUS"
}

const TEST_REQ_28 = {
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "mistral"
}

const TEST_REQ_29 = {
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "mistral",
  "llmModel": "MIXTRAL_8x7b"
}

const TEST_REQ_32 = {
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "whisperModel": "tiny"
}

const TEST_REQ_33 = {
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "transcriptServices": "deepgram"
}

const TEST_REQ_34 = {
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "transcriptServices": "deepgram",
  "llm": "ollama"
}

const TEST_REQ_35 = {
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "transcriptServices": "assembly"
}

const TEST_REQ_36 = {
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "transcriptServices": "assembly",
  "llm": "ollama"
}

const TEST_REQ_37 = {
  "url": "https://ajc.pics/audio/fsjam-short.mp3",
  "transcriptServices": "assembly",
  "speakerLabels": true
}

const TEST_REQ_38 = {
  "url": "https://ajc.pics/audio/fsjam-short.mp3",
  "transcriptServices": "assembly",
  "speakerLabels": true,
  "llm": "ollama"
}

const TEST_REQ_39 = {
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["titles", "mediumChapters"]
}

const TEST_REQ_40 = {
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["titles", "summary", "shortChapters", "takeaways", "questions"]
}

const TEST_REQ_41 = {
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["titles", "summary", "shortChapters", "takeaways", "questions"],
  "whisperModel": "tiny",
  "llm": "ollama"
}
```