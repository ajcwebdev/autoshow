# Step Endpoints

## Step 1 - Generate Markdown

Use this endpoint to just generate the metadata and front matter.

### Video input example

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk"
}' http://localhost:3000/generate-markdown \
  -s | json_pp
```

### File input example

```bash
curl --json '{
  "type": "file",
  "filePath": "content/examples/audio.mp3"
}' http://localhost:3000/generate-markdown \
  -s | json_pp
```

## Step 2 - Download Audio

Use this endpoint to download or convert the audio into a WAV file. Provide the `input`, `filename`, and optional `options` object with flags like `video` or `file`.

### Download audio from a YouTube URL

```bash
curl --json '{
  "input": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "filename": "ep0-fsjam-podcast",
  "options": {
    "video": "https://www.youtube.com/watch?v=MORMZXEaONk"
  }
}' http://localhost:3000/download-audio \
  -s | json_pp
```

### Convert local file to WAV

```bash
curl --json '{
  "input": "content/examples/audio.mp3",
  "filename": "audio",
  "options": {
    "file": "content/examples/audio.mp3"
  }
}' http://localhost:3000/download-audio \
  -s | json_pp
```

## Step 3 - Run Transcription

Use this endpoint to run the transcription step on a `.wav` file. You must provide the `finalPath` (without extension) and specify which transcription service to use.

### Whisper transcription

```bash
curl --json '{
  "finalPath": "content/audio",
  "transcriptServices": "whisper",
  "options": {
    "whisper": "tiny"
  }
}' http://localhost:3000/run-transcription \
  -s | json_pp
```

### Assembly transcription

```bash
curl --json '{
  "finalPath": "content/audio",
  "transcriptServices": "assembly",
  "options": {
    "assembly": "best",
    "assemblyApiKey": ""
  }
}' http://localhost:3000/run-transcription \
  -s | json_pp
```

### Groq transcription

```bash
curl --json '{
  "finalPath": "content/2024-09-24-ep0-fsjam-podcast",
  "transcriptServices": "groq",
  "options": {
    "groq": "whisper-large-v3",
    "groqApiKey": ""
  }
}' http://localhost:3000/run-transcription \
  -s | json_pp
```

### Deepgram with speaker labeling

```bash
curl --json '{
  "finalPath": "content/audio",
  "transcriptServices": "deepgram",
  "options": {
    "deepgram": "nova-2",
    "deepgramApiKey": "",
    "speakerLabels": true
  }
}' http://localhost:3000/run-transcription \
  -s | json_pp
```

## Step 4 - Select Prompt

Use this endpoint to generate a final prompt string from various prompt section choices, or a custom prompt file.

### Choose multiple built-in prompts

```bash
curl --json '{
  "options": {
    "prompt": ["summary", "longChapters", "quotes"]
  }
}' http://localhost:3000/select-prompt \
  -s | json_pp
```

### Use a custom prompt file

```bash
curl --json '{
  "options": {
    "customPrompt": "content/custom-prompt.md"
  }
}' http://localhost:3000/select-prompt \
  -s | json_pp
```

## Step 5 - Run LLM

Use this endpoint to run the final LLM step.

```bash
curl --json '{
  "filePath": "content/examples/audio-prompt.md",
  "llmServices": "chatgpt",
  "options": {
    "chatgpt": "gpt-4o-mini",
    "openaiApiKey": ""
  }
}' http://localhost:3000/run-llm \
  -s | json_pp
```