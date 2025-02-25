# AutoShow Server

## Outline

- [Start Server](#start-server)
- [Process Endpoint](#process-endpoint)
  - [Video Type](#video-type)
  - [File Type](#file-type)
- [Language Model (LLM) Options](#language-model-llm-options)
  - [Estimate LLM Cost](#estimate-llm-cost)
  - [Run Only LLM Process Step](#run-only-llm-process-step)
  - [ChatGPT](#chatgpt)
  - [Claude](#claude)
  - [Gemini](#gemini)
- [Transcription Options](#transcription-options)
  - [Whisper.cpp](#whispercpp)
  - [Deepgram](#deepgram)
  - [Assembly](#assembly)
  - [Estimate Transcription Cost](#estimate-transcription-cost)
- [Prompt Options](#prompt-options)
- [Test Railway](#test-railway)

## Start Server

Run the following command to start the server:

```bash
npm run serve
```

## Process Endpoint

Once the server is running, send a `POST` request to `http://localhost:3000/api/process` containing a JSON object:

### Video Type

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk"
}' http://localhost:3000/api/process
```

Use LLM.

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "whisperModel": "tiny",
  "llm": "ollama"
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "whisperModel": "tiny",
  "llm": "ollama",
  "llmModel": "DEEPSEEK_R1_1_5B"
}' http://localhost:3000/api/process
```

### File Type

```bash
curl --json '{
  "type": "file",
  "filePath": "content/audio.mp3"
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "file",
  "filePath": "content/audio.mp3",
  "whisperModel": "tiny",
  "llm": "ollama"
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "file",
  "filePath": "content/audio.mp3",
  "prompts": ["titles"],
  "whisperModel": "tiny",
  "llm": "ollama"
}' http://localhost:3000/api/process
```

## Language Model (LLM) Options

### Estimate LLM Cost

```bash
curl --json '{
  "type": "llmCost",
  "filePath": "content/audio-prompt.md",
  "llm": "chatgpt"
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "llmCost",
  "filePath": "content/audio-prompt.md",
  "llm": "claude"
}' http://localhost:3000/api/process
```

### Run Only LLM Process Step

Skip steps 1-4 and run LLM (ChatGPT) on a file with prompt and transcript.

```bash
curl --json '{
  "type": "runLLM",
  "filePath": "content/audio-prompt.md",
  "llm": "chatgpt"
}' http://localhost:3000/api/process
```

### ChatGPT

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "chatgpt"
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "chatgpt",
  "llmModel": "gpt-4o-mini"
}' http://localhost:3000/api/process
```

### Claude

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "claude"
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "claude",
  "llmModel": "CLAUDE_3_SONNET"
}' http://localhost:3000/api/process
```

### Gemini

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "gemini"
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "gemini",
  "llmModel": "gemini-1.5-flash"
}' http://localhost:3000/api/process
```

## Transcription Options

### Whisper.cpp

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "whisperModel": "tiny"
}' http://localhost:3000/api/process
```

### Deepgram

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "transcriptServices": "deepgram"
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "transcriptServices": "deepgram",
  "transcriptModel": "BASE"
}' http://localhost:3000/api/process
```

### Assembly

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "transcriptServices": "assembly"
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "transcriptServices": "assembly",
  "transcriptModel": "BEST"
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://ajc.pics/audio/fsjam-short.mp3",
  "transcriptServices": "assembly",
  "speakerLabels": true
}' http://localhost:3000/api/process
```

### Estimate Transcription Cost

```bash
curl --json '{
  "type": "transcriptCost",
  "filePath": "content/audio.mp3",
  "transcriptServices": "deepgram"
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "transcriptCost",
  "filePath": "content/audio.mp3",
  "transcriptServices": "assembly"
}' http://localhost:3000/api/process
```

## Prompt Options

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["titles", "mediumChapters"]
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["titles", "summary", "shortChapters", "takeaways", "questions"]
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "prompts": ["titles", "summary", "shortChapters", "takeaways", "questions"],
  "whisperModel": "tiny",
  "llm": "ollama"
}' http://localhost:3000/api/process
```

## Test Railway

### Setup Database on Railway

```bash
railway init --name custom-postgres-pgvector
railway add --database postgres --service pgvector-db --variables "RAILWAY_DOCKERFILE_PATH=.github/postgres-pgvector.Dockerfile"
railway up --service Postgres
railway variables -s Postgres --kv
echo "DATABASE_URL=$(railway variables -s Postgres --kv | grep DATABASE_PUBLIC_URL | cut -d'=' -f2)" >> .env
```

### Video Test Requests

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk"
}' -o "content/2024-09-24-ep0-fsjam-podcast-prompt.json" \
https://autodaily.show/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "llm": "chatgpt",
  "openaiApiKey": ""
}' -o "content/2024-09-24-ep0-fsjam-podcast-chatgpt.json" \
https://autodaily.show/api/process
```

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "transcriptServices": "deepgram",
  "deepgramApiKey": ""
}' -o "content/2024-09-24-ep0-fsjam-podcast-prompt.json" \
https://autodaily.show/api/process
```

## Create and Query Embeddings

```bash
curl --json '{
  "type": "createEmbeddings",
  "directory": "content"
}' http://localhost:3000/api/process
```

```bash
curl --json '{
  "type": "queryEmbeddings",
  "directory": "content",
  "question": "What'\''s the deal with these show notes? Answer in the voice of Jerry Seinfeld."
}' http://localhost:3000/api/process
```

## Experimental Deno and Bun Support

Add either of the following to your `scripts` in `package.json`.

```json
{
  "scripts": {
    "bun": "bun --env-file=.env --no-warnings src/commander.ts",
    "deno": "deno run --allow-sys --allow-read --allow-run --allow-write --allow-env --unstable-sloppy-imports src/commander.ts"
  }
}
```