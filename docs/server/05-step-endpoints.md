# Step Endpoints

## Step 2 - Download Audio

### Download audio from a YouTube URL

```bash
curl --json '{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=MORMZXEaONk",
  "filename": "ep0-fsjam-podcast",
  "options": {
    "video": "https://www.youtube.com/watch?v=MORMZXEaONk"
  }
}' http://localhost:4321/api/download-audio \
  -s | json_pp
```

### Convert local file to WAV

```bash
curl --json '{
  "type": "file",
  "filePath": "content/examples/audio.mp3",
  "options": {
    "file": "content/examples/audio.mp3"
  }
}' http://localhost:4321/api/download-audio \
  -s | json_pp
```

## Step 3 - Run Transcription

Use this endpoint to run the transcription step on a `.wav` file. You must provide the `finalPath` (without extension) and specify which transcription service to use.

### Assembly

```bash
curl --json '{
  "finalPath": "content/examples/audio",
  "transcriptServices": "assembly",
  "options": {
    "assembly": "nano",
    "assemblyApiKey": ""
  }
}' http://localhost:4321/api/run-transcription \
  -s | json_pp
```

### Deepgram

```bash
curl --json '{
  "finalPath": "content/examples/audio",
  "transcriptServices": "deepgram",
  "options": {
    "deepgram": "nova-2",
    "deepgramApiKey": ""
  }
}' http://localhost:4321/api/run-transcription \
  -s | json_pp
```

```bash
curl --json '{
  "finalPath": "content/examples/audio",
  "transcriptServices": "deepgram",
  "options": {
    "deepgram": "nova-2",
    "deepgramApiKey": "",
    "speakerLabels": true
  }
}' http://localhost:4321/api/run-transcription \
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
}' http://localhost:4321/api/select-prompt \
  -s | json_pp
```

### Use a custom prompt file

```bash
curl --json '{
  "options": {
    "customPrompt": "content/custom-prompt.md"
  }
}' http://localhost:4321/api/select-prompt \
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
}' http://localhost:4321/api/run-llm \
  -s | json_pp
```